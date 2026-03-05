import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import env from '../config/env.js'
import { sendTaskEmail } from '../lib/mailer.js'
import { requireAuth, requireRole, resolveTenantFromAuth } from '../middlewares/auth.js'
import { validateBody, validateQuery } from '../middlewares/validate.js'

const router = Router()

router.use(requireAuth)

function getTenantId(req) {
  const tenantIdFromQuery = typeof req.query.tenantId === 'string' ? req.query.tenantId : null
  return resolveTenantFromAuth(req, tenantIdFromQuery)
}

const listClientsQuerySchema = z.object({
  q: z.string().optional().default(''),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).optional().default('ALL'),
  tenantId: z.string().optional(),
})

const upsertClientSchema = z.object({
  name: z.string().min(2),
  alias: z.string().optional().nullable(),
  documentType: z.string().optional().nullable(),
  documentNumber: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
  contact: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  groups: z.array(z.string()).optional().default([]),
  visibility: z.string().optional().nullable(),
  uf: z.string().optional().nullable(),
  taxation: z.array(z.string()).optional().default([]),
  checklist: z.array(z.string()).optional().default([]),
  initialCompetence: z.string().optional().nullable(),
})

const listTasksQuerySchema = z.object({
  q: z.string().optional().default(''),
  type: z.enum(['TASK', 'SOLICITATION', 'ALL']).optional().default('ALL'),
  status: z.enum(['UPCOMING', 'OPEN', 'IN_PROGRESS', 'PENDING', 'DONE', 'DISMISSED', 'CANCELLED', 'OVERDUE', 'ALL']).optional().default('ALL'),
  tenantId: z.string().optional(),
})

const tenantStateBodySchema = z.object({
  state: z.object({}).passthrough(),
})

const tenantBrandingBodySchema = z.object({
  branding: z.object({}).passthrough(),
})

const sendTaskEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(3),
  message: z.string().optional().default(''),
  taskId: z.union([z.string(), z.number()]).optional(),
  taskSource: z.enum(['task', 'solicitation']).optional().default('task'),
  attachment: z.object({
    name: z.string().min(1),
    type: z.string().optional().default('application/octet-stream'),
    contentBase64: z.string().min(1),
  }),
})

const tenantUserCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(4),
  clientIds: z.array(z.string()).optional().default([]),
  role: z.enum(['TENANT_ADMIN', 'TENANT_USER']).optional().default('TENANT_USER'),
  isActive: z.boolean().optional().default(true),
})

const tenantUserUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(4).optional(),
  clientIds: z.array(z.string()).optional(),
  role: z.enum(['TENANT_ADMIN', 'TENANT_USER']).optional(),
  isActive: z.boolean().optional(),
})

const getEmptyTenantState = () => ({
  schemaVersion: 1,
  users: [],
  clients: [],
  tasksRows: [],
  taskBlueprints: [],
  solicitationRecords: [],
  taskActionLogs: [],
})

router.get('/users', async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId Ã© obrigatÃ³rio para este usuÃ¡rio.' })
    }

    const users = await prisma.tenantUser.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        clientIds: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return res.json(users)
  } catch (error) {
    return next(error)
  }
})

router.post(
  '/users',
  requireRole('TENANT_ADMIN', 'SUPER_ADMIN'),
  validateBody(tenantUserCreateSchema),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(req)
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId Ã© obrigatÃ³rio para este usuÃ¡rio.' })
      }

      const email = String(req.body.email || '')
        .trim()
        .toLowerCase()
      const name = String(req.body.name || '').trim()
      const password = String(req.body.password || '').trim()
      const role = req.body.role || 'TENANT_USER'
      const isActive = req.body.isActive !== false
      const candidateClientIds = Array.isArray(req.body.clientIds) ? req.body.clientIds : []

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Informe nome, e-mail e senha para cadastrar o usuÃ¡rio.' })
      }

      const emailInUse = await prisma.tenantUser.findUnique({ where: { email } })
      if (emailInUse) {
        return res.status(409).json({ message: 'JÃ¡ existe um usuÃ¡rio com esse e-mail.' })
      }

      const clientIds = Array.from(
        new Set(
          candidateClientIds
            .map((clientId) => String(clientId || '').trim())
            .filter(Boolean),
        ),
      )

      const created = await prisma.tenantUser.create({
        data: {
          tenantId,
          name,
          email,
          passwordHash: await bcrypt.hash(password, 10),
          role,
          isActive,
          clientIds,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          clientIds: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return res.status(201).json(created)
    } catch (error) {
      return next(error)
    }
  },
)

router.patch(
  '/users/:userId',
  requireRole('TENANT_ADMIN', 'SUPER_ADMIN'),
  validateBody(tenantUserUpdateSchema),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(req)
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId Ã© obrigatÃ³rio para este usuÃ¡rio.' })
      }

      const target = await prisma.tenantUser.findFirst({
        where: { id: req.params.userId, tenantId },
      })

      if (!target) {
        return res.status(404).json({ message: 'UsuÃ¡rio nÃ£o encontrado para este tenant.' })
      }

      const nextEmail = req.body.email
        ? String(req.body.email || '')
            .trim()
            .toLowerCase()
        : undefined

      if (nextEmail && nextEmail !== target.email) {
        const emailInUse = await prisma.tenantUser.findUnique({ where: { email: nextEmail } })
        if (emailInUse) {
          return res.status(409).json({ message: 'JÃ¡ existe um usuÃ¡rio com esse e-mail.' })
        }
      }

      let nextClientIds
      if (Array.isArray(req.body.clientIds)) {
        nextClientIds = Array.from(
          new Set(
            req.body.clientIds
              .map((clientId) => String(clientId || '').trim())
              .filter(Boolean),
          ),
        )
      }

      const updated = await prisma.tenantUser.update({
        where: { id: target.id },
        data: {
          ...(req.body.name ? { name: req.body.name.trim() } : {}),
          ...(nextEmail ? { email: nextEmail } : {}),
          ...(req.body.password ? { passwordHash: await bcrypt.hash(req.body.password, 10) } : {}),
          ...(nextClientIds ? { clientIds: nextClientIds } : {}),
          ...(typeof req.body.isActive === 'boolean' ? { isActive: req.body.isActive } : {}),
          ...(req.body.role ? { role: req.body.role } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          clientIds: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return res.json(updated)
    } catch (error) {
      return next(error)
    }
  },
)

router.delete(
  '/users/:userId',
  requireRole('TENANT_ADMIN', 'SUPER_ADMIN'),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(req)
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId Ã© obrigatÃ³rio para este usuÃ¡rio.' })
      }

      const target = await prisma.tenantUser.findFirst({
        where: { id: req.params.userId, tenantId },
      })

      if (!target) {
        return res.status(404).json({ message: 'UsuÃ¡rio nÃ£o encontrado para este tenant.' })
      }

      if (req.auth?.sub === target.id) {
        return res.status(400).json({ message: 'NÃ£o Ã© permitido excluir o usuÃ¡rio atualmente logado.' })
      }

      await prisma.tenantUser.delete({
        where: { id: target.id },
      })

      return res.status(204).send()
    } catch (error) {
      return next(error)
    }
  },
)

router.get('/summary', async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId Ã© obrigatÃ³rio para este usuÃ¡rio.' })
    }

    const [clientsTotal, clientsActive, tasksTotal, tasksOpen] = await Promise.all([
      prisma.client.count({ where: { tenantId } }),
      prisma.client.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.task.count({ where: { tenantId } }),
      prisma.task.count({ where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING', 'UPCOMING'] } } }),
    ])

    return res.json({
      tenantId,
      clientsTotal,
      clientsActive,
      tasksTotal,
      tasksOpen,
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/state', async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId ÃƒÂ© obrigatÃƒÂ³rio para este usuÃƒÂ¡rio.' })
    }

    const state = await prisma.tenantState.findUnique({
      where: { tenantId },
      select: { data: true, updatedAt: true },
    })

    return res.json({
      state: state?.data || getEmptyTenantState(),
      updatedAt: state?.updatedAt || null,
    })
  } catch (error) {
    return next(error)
  }
})

router.put('/state', validateBody(tenantStateBodySchema), async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId obrigatorio para este usuario.' })
    }

    const currentStateRecord = await prisma.tenantState.findUnique({
      where: { tenantId },
      select: { data: true },
    })
    const currentState =
      currentStateRecord?.data && typeof currentStateRecord.data === 'object'
        ? currentStateRecord.data
        : getEmptyTenantState()

    const incomingState =
      req.body?.state && typeof req.body.state === 'object' ? req.body.state : getEmptyTenantState()

    let stateToPersist = {
      ...incomingState,
      // Branding e salvo apenas pela rota /tenant/branding.
      // Isso evita que autosave com estado antigo apague a logo.
      branding:
        currentState?.branding && typeof currentState.branding === 'object'
          ? currentState.branding
          : incomingState?.branding && typeof incomingState.branding === 'object'
            ? incomingState.branding
            : {},
    }

    if (req.auth?.role === 'TENANT_USER') {
      stateToPersist = {
        ...stateToPersist,
        users: Array.isArray(currentState?.users) ? currentState.users : [],
      }
    }

    const persisted = await prisma.tenantState.upsert({
      where: { tenantId },
      update: { data: stateToPersist },
      create: {
        tenantId,
        data: stateToPersist,
      },
      select: { updatedAt: true },
    })

    return res.json({ ok: true, updatedAt: persisted.updatedAt })
  } catch (error) {
    return next(error)
  }
})

router.put(
  '/branding',
  requireRole('TENANT_ADMIN', 'SUPER_ADMIN'),
  validateBody(tenantBrandingBodySchema),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(req)
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId é obrigatório para este usuário.' })
      }

      const currentStateRecord = await prisma.tenantState.findUnique({
        where: { tenantId },
        select: { data: true },
      })

      const currentState =
        currentStateRecord?.data && typeof currentStateRecord.data === 'object'
          ? currentStateRecord.data
          : getEmptyTenantState()

      const brandingSource =
        req.body?.branding && typeof req.body.branding === 'object' ? req.body.branding : {}
      const nextBranding = {
        logoDataUrl:
          typeof brandingSource.logoDataUrl === 'string' ? brandingSource.logoDataUrl : '',
        logoName: typeof brandingSource.logoName === 'string' ? brandingSource.logoName : '',
      }

      const stateToPersist = {
        ...currentState,
        schemaVersion:
          typeof currentState.schemaVersion === 'number' ? currentState.schemaVersion : 1,
        branding: nextBranding,
      }

      const persisted = await prisma.tenantState.upsert({
        where: { tenantId },
        update: { data: stateToPersist },
        create: {
          tenantId,
          data: stateToPersist,
        },
        select: { updatedAt: true },
      })

      return res.json({ ok: true, updatedAt: persisted.updatedAt, branding: nextBranding })
    } catch (error) {
      return next(error)
    }
  },
)

router.post('/send-task-email', validateBody(sendTaskEmailSchema), async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId ÃƒÂ© obrigatÃƒÂ³rio para este usuÃƒÂ¡rio.' })
    }

    if (!env.smtpHost || !env.smtpUser || !env.smtpPass || !env.smtpFrom) {
      return res.status(400).json({
        message:
          'SMTP nÃ£o configurado no backend. Preencha SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e SMTP_FROM.',
      })
    }

    let attachmentBuffer
    try {
      attachmentBuffer = Buffer.from(req.body.attachment.contentBase64, 'base64')
    } catch {
      return res.status(400).json({ message: 'Anexo invÃ¡lido para envio por e-mail.' })
    }

    if (!attachmentBuffer?.length) {
      return res.status(400).json({ message: 'Anexo vazio para envio por e-mail.' })
    }

    const emailText = [
      `Encaminhamento automÃ¡tico da Hive Tarefas.`,
      req.body.taskId ? `ReferÃªncia: ${req.body.taskSource || 'task'} #${req.body.taskId}` : '',
      req.body.message || '',
    ]
      .filter(Boolean)
      .join('\n\n')

    const info = await sendTaskEmail({
      to: req.body.to,
      subject: req.body.subject,
      text: emailText,
      attachment: {
        name: req.body.attachment.name,
        type: req.body.attachment.type,
        buffer: attachmentBuffer,
      },
    })

    return res.json({
      ok: true,
      messageId: info?.messageId || null,
      sentAt: new Date().toISOString(),
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/clients', validateQuery(listClientsQuerySchema), async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId Ã© obrigatÃ³rio para este usuÃ¡rio.' })
    }

    const query = req.query.q.trim()
    const statusFilter = req.query.status

    const clients = await prisma.client.findMany({
      where: {
        tenantId,
        AND: [
          statusFilter !== 'ALL' ? { status: statusFilter } : {},
          query
            ? {
                OR: [
                  { name: { contains: query, mode: 'insensitive' } },
                  { alias: { contains: query, mode: 'insensitive' } },
                  { documentNumber: { contains: query, mode: 'insensitive' } },
                ],
              }
            : {},
        ],
      },
      orderBy: { createdAt: 'desc' },
    })

    return res.json(clients)
  } catch (error) {
    return next(error)
  }
})

router.post('/clients', validateBody(upsertClientSchema), async (req, res, next) => {
  try {
    const tenantId = resolveTenantFromAuth(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId Ã© obrigatÃ³rio para este usuÃ¡rio.' })
    }

    const client = await prisma.client.create({
      data: {
        tenantId,
        ...req.body,
        name: req.body.name.trim(),
        alias: req.body.alias?.trim() || null,
        email: req.body.email?.trim() || null,
      },
    })

    return res.status(201).json(client)
  } catch (error) {
    return next(error)
  }
})

router.get('/tasks', validateQuery(listTasksQuerySchema), async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId Ã© obrigatÃ³rio para este usuÃ¡rio.' })
    }

    const query = req.query.q.trim()
    const typeFilter = req.query.type
    const statusFilter = req.query.status

    const tasks = await prisma.task.findMany({
      where: {
        tenantId,
        AND: [
          typeFilter !== 'ALL' ? { type: typeFilter } : {},
          statusFilter !== 'ALL' ? { status: statusFilter } : {},
          query
            ? {
                OR: [
                  { title: { contains: query, mode: 'insensitive' } },
                  { department: { contains: query, mode: 'insensitive' } },
                  { competence: { contains: query, mode: 'insensitive' } },
                  { client: { name: { contains: query, mode: 'insensitive' } } },
                ],
              }
            : {},
        ],
      },
      include: {
        client: { select: { id: true, name: true, documentNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return res.json(tasks)
  } catch (error) {
    return next(error)
  }
})

export default router

