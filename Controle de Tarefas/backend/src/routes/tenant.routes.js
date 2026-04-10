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

const MAX_DOCS_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024

const docsSolicitationCreateSchema = z.object({
  departamento: z.string().min(1),
  processo: z.string().optional().default(''),
  etapa: z.string().optional().default('Aberta'),
  assunto: z.string().min(1),
  clientIds: z.array(z.string().min(1)).optional().default([]),
  actionDate: z.string().min(1),
  metaDate: z.string().min(1),
  dueDate: z.string().min(1),
  andamento: z.string().min(1),
  responsavel: z.string().optional().default(''),
  attachments: z
    .array(
      z.object({
        name: z.string().min(1),
        size: z.number().int().nonnegative().max(MAX_DOCS_ATTACHMENT_SIZE_BYTES).optional().default(0),
        type: z.string().optional().default('application/octet-stream'),
        contentBase64: z.string().min(1),
      }),
    )
    .optional()
    .default([]),
})

const portalDocumentDownloadSchema = z.object({
  documentKey: z.string().min(1),
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
  docsReceivedDownloads: [],
})

const getTenantStateRecord = async (tenantId) =>
  prisma.tenantState.findUnique({
    where: { tenantId },
    select: { data: true, updatedAt: true },
  })

const getTenantStateData = (stateRecord) =>
  stateRecord?.data && typeof stateRecord.data === 'object' ? stateRecord.data : getEmptyTenantState()

const normalizeLookupText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

const normalizeClientDocument = (client) =>
  String(client?.inscricao || client?.documentNumber || '')
    .trim()

const normalizeClientsFromState = (stateData) => {
  const source = Array.isArray(stateData?.clients) ? stateData.clients : []
  return source
    .map((client) => ({
      id: String(client?.id || '').trim(),
      nome: String(client?.nome || client?.name || '').trim(),
      status: String(client?.status || '').trim() || 'Ativo',
      inscricao: normalizeClientDocument(client),
      email: String(client?.email || '').trim(),
    }))
    .filter((client) => client.id && client.nome)
}

const findClientByUserIdentity = (clients, authUser) => {
  const source = Array.isArray(clients) ? clients : []
  if (!source.length) return null

  const normalizedUserEmail = normalizeLookupText(authUser?.email || '')
  if (normalizedUserEmail) {
    const byEmail = source.find(
      (client) => normalizeLookupText(client?.email || '') === normalizedUserEmail,
    )
    if (byEmail) return byEmail
  }

  const normalizedUserName = normalizeLookupText(authUser?.name || '')
  if (!normalizedUserName) return null

  const byExactName = source.find((client) => normalizeLookupText(client?.nome || '') === normalizedUserName)
  if (byExactName) return byExactName

  if (normalizedUserName.length < 5) return null

  return (
    source.find((client) => {
      const normalizedClientName = normalizeLookupText(client?.nome || '')
      if (!normalizedClientName) return false
      return (
        normalizedClientName.includes(normalizedUserName) ||
        normalizedUserName.includes(normalizedClientName)
      )
    }) || null
  )
}

const getNextSolicitationId = (records) =>
  records.reduce((maxId, record) => {
    const numericId = Number(record?.id)
    return Number.isFinite(numericId) ? Math.max(maxId, numericId) : maxId
  }, 0) + 1

const normalizeDisplayDate = (value) => {
  const text = String(value || '').trim()
  if (!text) return ''
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return `${day}/${month}/${year}`
  }
  const brMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (brMatch) {
    const [, day, month, year] = brMatch
    return `${day}/${month}/${year}`
  }
  return text
}

const getDateFromTaggedList = (dates, tag) => {
  const source = Array.isArray(dates) ? dates : []
  const prefix = `${String(tag || '').trim().toUpperCase()}:`
  const entry = source.find((item) =>
    String(item || '')
      .trim()
      .toUpperCase()
      .startsWith(prefix),
  )
  if (!entry) return ''
  return normalizeDisplayDate(String(entry).slice(prefix.length).trim())
}

const getCompetenceFromActionDate = (actionDate) => {
  const normalized = normalizeDisplayDate(actionDate)
  const match = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return ''
  const [, , month, year] = match
  return `${month}/${year}`
}

const getPortalDocumentDownloadsByKey = (stateData, authUser) => {
  const source = Array.isArray(stateData?.docsReceivedDownloads) ? stateData.docsReceivedDownloads : []
  const authUserId = String(authUser?.id || '').trim()
  const authUserEmail = normalizeLookupText(authUser?.email || '')
  const map = new Map()

  for (const entry of source) {
    const key = String(entry?.key || '').trim()
    const downloadedAt = String(entry?.downloadedAt || '').trim()
    const entryUserId = String(entry?.userId || '').trim()
    const entryUserEmail = normalizeLookupText(entry?.userEmail || '')
    if (!key || !downloadedAt) continue

    const sameUserById = Boolean(authUserId && entryUserId && authUserId === entryUserId)
    const sameUserByEmail = Boolean(authUserEmail && entryUserEmail && authUserEmail === entryUserEmail)
    if (!sameUserById && !sameUserByEmail) continue
    map.set(key, downloadedAt)
  }

  return map
}

const buildPortalDocumentKey = ({ source, recordId, attachmentId, attachmentName, index }) =>
  `${String(source || '').trim()}::${String(recordId || '').trim()}::${String(attachmentId || '').trim() || index}::${String(attachmentName || '').trim()}`

const buildPortalDocumentsFromState = ({
  stateData,
  visibleClients,
  isTenantRestrictedUser,
  authUser,
}) => {
  const visibleClientIds = new Set((Array.isArray(visibleClients) ? visibleClients : []).map((client) => client.id))
  const visibleClientNames = new Set(
    (Array.isArray(visibleClients) ? visibleClients : [])
      .map((client) => normalizeLookupText(client?.nome || ''))
      .filter(Boolean),
  )
  const authUserId = String(authUser?.id || '').trim()
  const authUserEmail = normalizeLookupText(authUser?.email || '')
  const downloadsByKey = getPortalDocumentDownloadsByKey(stateData, authUser)

  const isRecordVisible = ({ clientId, clientName, createdByUserId = '', createdByUserEmail = '' }) => {
    if (!isTenantRestrictedUser) return true
    const normalizedClientId = String(clientId || '').trim()
    const normalizedClientName = normalizeLookupText(clientName || '')
    const normalizedCreatedByUserId = String(createdByUserId || '').trim()
    const normalizedCreatedByUserEmail = normalizeLookupText(createdByUserEmail || '')

    if (normalizedClientId && visibleClientIds.has(normalizedClientId)) return true
    if (normalizedClientName && visibleClientNames.has(normalizedClientName)) return true
    if (normalizedCreatedByUserId && authUserId && normalizedCreatedByUserId === authUserId) return true
    if (normalizedCreatedByUserEmail && authUserEmail && normalizedCreatedByUserEmail === authUserEmail) return true
    return false
  }

  const tasksRows = Array.isArray(stateData?.tasksRows) ? stateData.tasksRows : []
  const documents = []

  for (const row of tasksRows) {
    const rowId = String(row?.id || '').trim()
    const attachments = Array.isArray(row?.attachments) ? row.attachments : []
    const clientId = String(row?.clientId || '').trim()
    const clientName = String(row?.client || row?.clientName || '').trim()
    if (!attachments.length || !isRecordVisible({ clientId, clientName })) continue

    for (let index = 0; index < attachments.length; index += 1) {
      const attachment = attachments[index]
      const attachmentName = String(attachment?.name || '').trim()
      const contentBase64 = String(attachment?.contentBase64 || '').trim()
      if (!attachmentName && !contentBase64) continue

      const documentKey = buildPortalDocumentKey({
        source: 'task',
        recordId: rowId,
        attachmentId: String(attachment?.id || '').trim(),
        attachmentName,
        index,
      })
      const downloadedAt = String(downloadsByKey.get(documentKey) || '').trim()
      const actionDate = getDateFromTaggedList(row?.dates, 'A')
      const metaDate = getDateFromTaggedList(row?.dates, 'M')
      const dueDate = getDateFromTaggedList(row?.dates, 'V')

      documents.push({
        documentKey,
        source: 'task',
        taskId: rowId,
        attachmentId: String(attachment?.id || '').trim(),
        attachmentName: attachmentName || `anexo-${index + 1}`,
        attachmentSize: Number(attachment?.size || 0),
        attachmentType: String(attachment?.type || 'application/octet-stream'),
        contentBase64,
        status: downloadedAt ? 'Arquivo baixado' : 'Disponivel',
        downloadedAt,
        departamento: String(row?.dept || '').trim(),
        nome: String(row?.subject || '').trim(),
        competencia: String(row?.competence || '').trim() || getCompetenceFromActionDate(actionDate),
        cliente: clientName || 'Cliente nao informado',
        actionDate,
        metaDate,
        dueDate,
        conclusionDate: normalizeDisplayDate(row?.conclusionDate || ''),
        responsavel: String(row?.owner || '').trim(),
      })
    }
  }

  return documents.sort((a, b) => {
    const aId = Number(a?.taskId || 0)
    const bId = Number(b?.taskId || 0)
    if (Number.isFinite(aId) && Number.isFinite(bId) && aId !== bId) return bId - aId
    return String(a?.attachmentName || '').localeCompare(String(b?.attachmentName || ''), 'pt-BR')
  })
}

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
      docsReceivedDownloads: Array.isArray(incomingState?.docsReceivedDownloads)
        ? incomingState.docsReceivedDownloads
        : Array.isArray(currentState?.docsReceivedDownloads)
          ? currentState.docsReceivedDownloads
          : [],
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
      const currentTasksRows = Array.isArray(currentState?.tasksRows) ? currentState.tasksRows : []
      const incomingTasksRows = Array.isArray(stateToPersist?.tasksRows) ? stateToPersist.tasksRows : []
      const currentTaskIds = new Set(currentTasksRows.map((task) => String(task?.id ?? '')))
      const canPersistTaskRowsWithoutCreateOrDelete =
        incomingTasksRows.length === currentTasksRows.length &&
        incomingTasksRows.every((task) => currentTaskIds.has(String(task?.id ?? '')))

      stateToPersist = {
        ...stateToPersist,
        users: Array.isArray(currentState?.users) ? currentState.users : [],
        clients: Array.isArray(currentState?.clients) ? currentState.clients : [],
        taskBlueprints: Array.isArray(currentState?.taskBlueprints) ? currentState.taskBlueprints : [],
        tasksRows: canPersistTaskRowsWithoutCreateOrDelete ? incomingTasksRows : currentTasksRows,
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

router.get('/portal/bootstrap', async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId é obrigatório para este usuário.' })
    }

    const authUser = await prisma.tenantUser.findFirst({
      where: { id: req.auth?.sub, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clientIds: true,
      },
    })

    if (!authUser) {
      return res.status(403).json({ message: 'Usuário sem acesso ao tenant informado.' })
    }

    const stateRecord = await getTenantStateRecord(tenantId)
    const stateData = getTenantStateData(stateRecord)
    const stateClients = normalizeClientsFromState(stateData)
    const stateSolicitations = Array.isArray(stateData?.solicitationRecords)
      ? stateData.solicitationRecords
      : []

    const isTenantRestrictedUser = authUser.role === 'TENANT_USER'
    const allowedClientIds = new Set(
      (Array.isArray(authUser.clientIds) ? authUser.clientIds : [])
        .map((clientId) => String(clientId || '').trim())
        .filter(Boolean),
    )
    const fallbackClientByIdentity = findClientByUserIdentity(stateClients, authUser)
    const effectiveAllowedClientIds =
      isTenantRestrictedUser && allowedClientIds.size === 0 && fallbackClientByIdentity?.id
        ? new Set([String(fallbackClientByIdentity.id).trim()])
        : allowedClientIds

    const visibleClients = isTenantRestrictedUser
      ? stateClients.filter((client) => effectiveAllowedClientIds.has(client.id))
      : stateClients

    const visibleClientIds = new Set(visibleClients.map((client) => client.id))
    const visibleSolicitations = stateSolicitations
      .filter((record) => {
        if (!isTenantRestrictedUser) return true
        const recordClientId = String(record?.clientId || '').trim()
        if (recordClientId) return visibleClientIds.has(recordClientId)

        const createdByUserId = String(record?.createdByUserId || '').trim()
        const createdByUserEmail = normalizeLookupText(record?.createdByUserEmail || '')
        const authUserId = String(authUser?.id || '').trim()
        const authUserEmail = normalizeLookupText(authUser?.email || '')
        if (createdByUserId && authUserId && createdByUserId === authUserId) return true
        if (createdByUserEmail && authUserEmail && createdByUserEmail === authUserEmail) return true

        const recordClientName = normalizeLookupText(record?.clientName || '')
        const fallbackClientName = normalizeLookupText(fallbackClientByIdentity?.nome || '')
        return Boolean(recordClientName && fallbackClientName && recordClientName === fallbackClientName)
      })
      .map((record) => {
        const recordClientId = String(record?.clientId || '').trim()
        const linkedClient = visibleClients.find((client) => client.id === recordClientId)
        return {
          ...record,
          clientId: recordClientId || record?.clientId || '',
          clientName:
            String(record?.clientName || '').trim() || linkedClient?.nome || 'Cliente não informado',
        }
      })
      .sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0))

    const visibleDocuments = buildPortalDocumentsFromState({
      stateData,
      visibleClients,
      isTenantRestrictedUser,
      authUser,
    }).map((documentRow) => {
      const { contentBase64, ...meta } = documentRow
      return {
        ...meta,
        hasContent: Boolean(String(contentBase64 || '').trim()),
      }
    })

    return res.json({
      user: {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        clientIds: Array.isArray(authUser.clientIds) ? authUser.clientIds : [],
      },
      clients: visibleClients,
      solicitations: visibleSolicitations,
      documents: visibleDocuments,
      updatedAt: stateRecord?.updatedAt || null,
    })
  } catch (error) {
    return next(error)
  }
})

router.post(
  '/portal/documents/download',
  validateBody(portalDocumentDownloadSchema),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(req)
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId e obrigatorio para este usuario.' })
      }

      const authUser = await prisma.tenantUser.findFirst({
        where: { id: req.auth?.sub, tenantId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          clientIds: true,
        },
      })

      if (!authUser) {
        return res.status(403).json({ message: 'Usuario sem acesso ao tenant informado.' })
      }

      const stateRecord = await getTenantStateRecord(tenantId)
      const stateData = getTenantStateData(stateRecord)
      const stateClients = normalizeClientsFromState(stateData)

      const isTenantRestrictedUser = authUser.role === 'TENANT_USER'
      const allowedClientIds = new Set(
        (Array.isArray(authUser.clientIds) ? authUser.clientIds : [])
          .map((clientId) => String(clientId || '').trim())
          .filter(Boolean),
      )
      const fallbackClientByIdentity = findClientByUserIdentity(stateClients, authUser)
      const effectiveAllowedClientIds =
        isTenantRestrictedUser && allowedClientIds.size === 0 && fallbackClientByIdentity?.id
          ? new Set([String(fallbackClientByIdentity.id).trim()])
          : allowedClientIds

      const visibleClients = isTenantRestrictedUser
        ? stateClients.filter((client) => effectiveAllowedClientIds.has(client.id))
        : stateClients

      const portalDocuments = buildPortalDocumentsFromState({
        stateData,
        visibleClients,
        isTenantRestrictedUser,
        authUser,
      })

      const documentKey = String(req.body?.documentKey || '').trim()
      const targetDocument = portalDocuments.find((item) => String(item?.documentKey || '').trim() === documentKey)
      if (!targetDocument) {
        return res.status(404).json({ message: 'Documento nao encontrado para este usuario.' })
      }

      const contentBase64 = String(targetDocument?.contentBase64 || '').trim()
      if (!contentBase64) {
        return res.status(400).json({ message: 'O anexo selecionado nao possui conteudo para download.' })
      }

      const downloadedAt = new Date().toISOString()
      const currentDownloads = Array.isArray(stateData?.docsReceivedDownloads)
        ? stateData.docsReceivedDownloads
        : []
      const authUserId = String(authUser.id || '').trim()
      const authUserEmail = String(authUser.email || '').trim()
      const authUserEmailNormalized = normalizeLookupText(authUserEmail)

      const nextDownloads = [
        ...currentDownloads.filter((entry) => {
          const sameKey = String(entry?.key || '').trim() === documentKey
          const sameUserById = String(entry?.userId || '').trim() === authUserId
          const sameUserByEmail =
            Boolean(authUserEmailNormalized) &&
            normalizeLookupText(String(entry?.userEmail || '').trim()) === authUserEmailNormalized
          return !(sameKey && (sameUserById || sameUserByEmail))
        }),
        {
          key: documentKey,
          userId: authUserId,
          userEmail: authUserEmail,
          downloadedAt,
        },
      ]

      const stateToPersist = {
        ...stateData,
        schemaVersion: typeof stateData?.schemaVersion === 'number' ? stateData.schemaVersion : 1,
        docsReceivedDownloads: nextDownloads,
      }

      await prisma.tenantState.upsert({
        where: { tenantId },
        update: { data: stateToPersist },
        create: {
          tenantId,
          data: stateToPersist,
        },
      })

      return res.json({
        ok: true,
        downloadedAt,
        file: {
          name: String(targetDocument.attachmentName || 'documento'),
          type: String(targetDocument.attachmentType || 'application/octet-stream'),
          size: Number(targetDocument.attachmentSize || 0),
          contentBase64,
        },
      })
    } catch (error) {
      return next(error)
    }
  },
)

router.post(
  '/portal/solicitations',
  validateBody(docsSolicitationCreateSchema),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(req)
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId é obrigatório para este usuário.' })
      }

      const authUser = await prisma.tenantUser.findFirst({
        where: { id: req.auth?.sub, tenantId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          clientIds: true,
        },
      })

      if (!authUser) {
        return res.status(403).json({ message: 'Usuário sem acesso ao tenant informado.' })
      }

      const stateRecord = await getTenantStateRecord(tenantId)
      const stateData = getTenantStateData(stateRecord)
      const stateClients = normalizeClientsFromState(stateData)
      const currentSolicitationRecords = Array.isArray(stateData?.solicitationRecords)
        ? stateData.solicitationRecords
        : []

      const isTenantRestrictedUser = authUser.role === 'TENANT_USER'
      const allowedClientIds = new Set(
        (Array.isArray(authUser.clientIds) ? authUser.clientIds : [])
          .map((clientId) => String(clientId || '').trim())
          .filter(Boolean),
      )

      const requestedClientIds = Array.from(
        new Set(
          (Array.isArray(req.body.clientIds) ? req.body.clientIds : [])
            .map((clientId) => String(clientId || '').trim())
            .filter(Boolean),
        ),
      )

      const fallbackClientByIdentity = findClientByUserIdentity(stateClients, authUser)
      const allowedClientIdsList = Array.from(allowedClientIds)
      const defaultClientId =
        requestedClientIds.length > 0
          ? ''
          : isTenantRestrictedUser && allowedClientIdsList.length > 0
            ? fallbackClientByIdentity?.id && allowedClientIds.has(String(fallbackClientByIdentity.id).trim())
              ? String(fallbackClientByIdentity.id).trim()
              : String(allowedClientIdsList[0] || '').trim()
            : String(fallbackClientByIdentity?.id || '').trim()
      const effectiveClientIds = requestedClientIds.length > 0 ? requestedClientIds : [defaultClientId].filter(Boolean)

      let targetClients = stateClients.filter((client) => {
        if (!effectiveClientIds.includes(client.id)) return false
        if (!isTenantRestrictedUser) return true
        if (allowedClientIds.size > 0) return allowedClientIds.has(client.id)
        return true
      })

      if (!targetClients.length) {
        if (requestedClientIds.length > 0) {
          return res.status(400).json({
            message: 'Nenhum cliente válido encontrado para criar a solicitação.',
          })
        }
        targetClients = [
          {
            id: '',
            nome: String(authUser.name || '').trim() || 'Cliente não informado',
            status: 'Ativo',
            inscricao: '',
            email: String(authUser.email || '').trim(),
          },
        ]
      }

      let nextId = getNextSolicitationId(currentSolicitationRecords)
      const departamento = String(req.body.departamento || '').trim()
      const processo = String(req.body.processo || '').trim()
      const etapa = String(req.body.etapa || '').trim() || 'Aberta'
      const assunto = String(req.body.assunto || '').trim()
      const actionDate = String(req.body.actionDate || '').trim()
      const metaDate = String(req.body.metaDate || '').trim()
      const dueDate = String(req.body.dueDate || '').trim()
      const andamento = String(req.body.andamento || '').trim()
      const responsavel = String(req.body.responsavel || '').trim() || String(authUser.name || '').trim()
      const createdAt = new Date().toISOString()
      const incomingAttachments = Array.isArray(req.body.attachments) ? req.body.attachments : []
      const normalizedIncomingAttachments = []

      for (const attachment of incomingAttachments) {
        const attachmentName = String(attachment?.name || 'anexo')
        const attachmentType = String(attachment?.type || 'application/octet-stream')
        const contentBase64 = String(attachment?.contentBase64 || '').trim()
        let decodedSize = 0
        try {
          decodedSize = Buffer.byteLength(contentBase64, 'base64')
        } catch {
          return res.status(400).json({ message: `Anexo inválido: ${attachmentName}.` })
        }

        if (!decodedSize) {
          return res.status(400).json({ message: `Anexo vazio: ${attachmentName}.` })
        }

        if (decodedSize > MAX_DOCS_ATTACHMENT_SIZE_BYTES) {
          return res
            .status(400)
            .json({ message: `O anexo ${attachmentName} excede 25MB. Limite por documento: 25MB.` })
        }

        normalizedIncomingAttachments.push({
          name: attachmentName,
          type: attachmentType,
          size: decodedSize,
          contentBase64,
        })
      }

      const newRecords = targetClients.map((client) => {
        const recordId = nextId
        const recordAttachments = normalizedIncomingAttachments.map((attachment, index) => ({
          id: `${recordId}-${index}-${String(attachment.name || 'anexo')}`,
          name: String(attachment.name || 'anexo'),
          size: Number(attachment.size || 0),
          type: String(attachment.type || 'application/octet-stream'),
          contentBase64: String(attachment.contentBase64 || ''),
        }))
        const record = {
          id: recordId,
          departamento,
          processo,
          etapa,
          assunto,
          clientId: String(client.id || '').trim(),
          clientName:
            String(client.nome || '').trim() || String(authUser.name || '').trim() || 'Cliente não informado',
          actionDate,
          metaDate,
          dueDate,
          andamento,
          responsavel,
          convidados: '',
          attachments: recordAttachments,
          notifyOpen: false,
          notifyEnd: false,
          notifyGuests: false,
          replicateSubtasks: false,
          iAmResponsible: false,
          iAmAuthorizer: false,
          status: '',
          tag: 'success',
          deliveryDate: '',
          conclusionDate: '',
          baixaAt: '',
          baixaAction: '',
          justification: '',
          emailSentAt: '',
          emailSentTo: '',
          createdAt,
          createdByUserId: String(authUser.id || '').trim(),
          createdByUserEmail: String(authUser.email || '').trim(),
          source: 'hive-docs',
        }
        nextId += 1
        return record
      })

      const stateToPersist = {
        ...stateData,
        schemaVersion: typeof stateData?.schemaVersion === 'number' ? stateData.schemaVersion : 1,
        solicitationRecords: [...newRecords, ...currentSolicitationRecords],
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

      return res.status(201).json({
        ok: true,
        records: newRecords,
        updatedAt: persisted.updatedAt,
      })
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

router.post('/clients', requireRole('TENANT_ADMIN', 'SUPER_ADMIN'), validateBody(upsertClientSchema), async (req, res, next) => {
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

