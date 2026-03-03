import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth, resolveTenantFromAuth } from '../middlewares/auth.js'
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

const getEmptyTenantState = () => ({
  schemaVersion: 1,
  users: [],
  clients: [],
  tasksRows: [],
  taskBlueprints: [],
  solicitationRecords: [],
  taskActionLogs: [],
})

router.get('/summary', async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId é obrigatório para este usuário.' })
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
      return res.status(400).json({ message: 'tenantId Ã© obrigatÃ³rio para este usuÃ¡rio.' })
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
      return res.status(400).json({ message: 'tenantId Ã© obrigatÃ³rio para este usuÃ¡rio.' })
    }

    const persisted = await prisma.tenantState.upsert({
      where: { tenantId },
      update: { data: req.body.state },
      create: {
        tenantId,
        data: req.body.state,
      },
      select: { updatedAt: true },
    })

    return res.json({ ok: true, updatedAt: persisted.updatedAt })
  } catch (error) {
    return next(error)
  }
})

router.get('/clients', validateQuery(listClientsQuerySchema), async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId é obrigatório para este usuário.' })
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
      return res.status(400).json({ message: 'tenantId é obrigatório para este usuário.' })
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
      return res.status(400).json({ message: 'tenantId é obrigatório para este usuário.' })
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
