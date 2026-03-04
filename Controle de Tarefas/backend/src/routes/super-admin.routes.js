import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { validateBody, validateQuery } from '../middlewares/validate.js'
import { slugify } from '../utils/slugify.js'

const router = Router()

router.use(requireAuth, requireRole('SUPER_ADMIN'))

const tenantListQuerySchema = z.object({
  q: z.string().optional().default(''),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).optional().default('ALL'),
})

const tenantCreateSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  adminName: z.string().min(2).optional(),
  adminEmail: z.string().email().optional(),
  adminPassword: z.string().min(6).optional(),
})

const tenantUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

const tenantAdminUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
})

const clientBaseSchema = z.object({
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

const clientListQuerySchema = z.object({
  q: z.string().optional().default(''),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).optional().default('ALL'),
})

const clientUpdateSchema = clientBaseSchema.partial()

router.get('/dashboard', async (_req, res, next) => {
  try {
    const [tenantsTotal, tenantsActive, clientsTotal, usersTotal, tasksTotal] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.client.count(),
      prisma.tenantUser.count(),
      prisma.task.count(),
    ])

    return res.json({
      tenantsTotal,
      tenantsActive,
      clientsTotal,
      usersTotal,
      tasksTotal,
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/tenants', validateQuery(tenantListQuerySchema), async (req, res, next) => {
  try {
    const query = req.query.q.trim().toLowerCase()
    const statusFilter = req.query.status

    const tenants = await prisma.tenant.findMany({
      where: {
        AND: [
          statusFilter !== 'ALL' ? { status: statusFilter } : {},
          query
            ? {
                OR: [
                  { name: { contains: query, mode: 'insensitive' } },
                  { slug: { contains: query, mode: 'insensitive' } },
                ],
              }
            : {},
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { clients: true, users: true, tasks: true },
        },
      },
    })

    return res.json(tenants)
  } catch (error) {
    return next(error)
  }
})

router.post('/tenants', validateBody(tenantCreateSchema), async (req, res, next) => {
  try {
    const slug = slugify(req.body.slug || req.body.name)
    if (!slug) {
      return res.status(400).json({ message: 'Slug inválido para o tenant.' })
    }

    const exists = await prisma.tenant.findUnique({ where: { slug } })
    if (exists) {
      return res.status(409).json({ message: 'Slug já utilizado.' })
    }

    const adminEmail = req.body.adminEmail?.toLowerCase().trim()
    const adminPassword = req.body.adminPassword?.trim()
    const adminName = req.body.adminName?.trim()

    if (!adminEmail || !adminPassword) {
      return res.status(400).json({ message: 'Informe e-mail e senha do admin para criar o tenant.' })
    }

    const tenant = await prisma.$transaction(async (tx) => {
      const createdTenant = await tx.tenant.create({
        data: {
          name: req.body.name.trim(),
          slug,
          status: 'ACTIVE',
        },
      })

      const userExists = await tx.tenantUser.findUnique({ where: { email: adminEmail } })
      if (userExists) {
        throw new Error('ADMIN_EMAIL_ALREADY_EXISTS')
      }

      await tx.tenantUser.create({
        data: {
          tenantId: createdTenant.id,
          name: adminName || `Admin ${createdTenant.name}`,
          email: adminEmail,
          passwordHash: await bcrypt.hash(adminPassword, 10),
          role: 'TENANT_ADMIN',
          isActive: true,
        },
      })

      return createdTenant
    })

    return res.status(201).json(tenant)
  } catch (error) {
    if (error.message === 'ADMIN_EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({ message: 'E-mail do admin já cadastrado.' })
    }
    return next(error)
  }
})

router.patch('/tenants/:tenantId', validateBody(tenantUpdateSchema), async (req, res, next) => {
  try {
    const tenantId = req.params.tenantId
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant não encontrado.' })
    }

    const nextSlug = req.body.slug ? slugify(req.body.slug) : undefined
    if (nextSlug && nextSlug !== tenant.slug) {
      const slugUsed = await prisma.tenant.findUnique({ where: { slug: nextSlug } })
      if (slugUsed) {
        return res.status(409).json({ message: 'Slug já utilizado.' })
      }
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: req.body.name?.trim(),
        slug: nextSlug,
        status: req.body.status,
      },
    })

    return res.json(updated)
  } catch (error) {
    return next(error)
  }
})

router.delete('/tenants/:tenantId', async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.tenantId } })
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant não encontrado.' })
    }

    await prisma.$transaction(async (tx) => {
      await tx.tenantUser.deleteMany({
        where: { tenantId: tenant.id },
      })

      await tx.tenant.delete({
        where: { id: tenant.id },
      })
    })

    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

router.patch('/tenants/:tenantId/admin', validateBody(tenantAdminUpdateSchema), async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.tenantId } })
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant n�o encontrado.' })
    }

    const adminUser = await prisma.tenantUser.findFirst({
      where: {
        tenantId: tenant.id,
        role: 'TENANT_ADMIN',
      },
      orderBy: { createdAt: 'asc' },
    })

    const nextName = req.body.name?.trim()
    const nextEmail = req.body.email?.toLowerCase().trim()
    const nextPassword = req.body.password

    if (!adminUser) {
      if (!nextEmail || !nextPassword) {
        return res.status(400).json({
          message: 'Esse tenant ainda n�o possui admin. Informe e-mail e senha para criar o acesso.',
        })
      }

      const emailInUse = await prisma.tenantUser.findUnique({ where: { email: nextEmail } })
      if (emailInUse) {
        return res.status(409).json({ message: 'E-mail do admin j� est� em uso.' })
      }

      const createdUser = await prisma.tenantUser.create({
        data: {
          tenantId: tenant.id,
          name: nextName || `Admin ${tenant.name}`,
          email: nextEmail,
          passwordHash: await bcrypt.hash(nextPassword, 10),
          role: 'TENANT_ADMIN',
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return res.json(createdUser)
    }

    if (nextEmail && nextEmail !== adminUser.email) {
      const emailInUse = await prisma.tenantUser.findUnique({ where: { email: nextEmail } })
      if (emailInUse) {
        return res.status(409).json({ message: 'E-mail do admin j� est� em uso.' })
      }
    }

    const updatedUser = await prisma.tenantUser.update({
      where: { id: adminUser.id },
      data: {
        ...(nextName ? { name: nextName } : {}),
        ...(nextEmail ? { email: nextEmail } : {}),
        ...(nextPassword ? { passwordHash: await bcrypt.hash(nextPassword, 10) } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return res.json(updatedUser)
  } catch (error) {
    return next(error)
  }
})

router.get('/tenants/:tenantId/users', async (req, res, next) => {
  try {
    const users = await prisma.tenantUser.findMany({
      where: { tenantId: req.params.tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        clientIds: true,
        createdAt: true,
      },
    })

    return res.json(users)
  } catch (error) {
    return next(error)
  }
})

router.get(
  '/tenants/:tenantId/clients',
  validateQuery(clientListQuerySchema),
  async (req, res, next) => {
    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: req.params.tenantId } })
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant não encontrado.' })
      }

      const query = req.query.q.trim().toLowerCase()
      const statusFilter = req.query.status

      const clients = await prisma.client.findMany({
        where: {
          tenantId: tenant.id,
          AND: [
            statusFilter !== 'ALL' ? { status: statusFilter } : {},
            query
              ? {
                  OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { alias: { contains: query, mode: 'insensitive' } },
                    { documentNumber: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
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
  },
)

router.post('/tenants/:tenantId/clients', validateBody(clientBaseSchema), async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.tenantId } })
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant não encontrado.' })
    }

    const client = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        ...req.body,
        name: req.body.name.trim(),
        alias: req.body.alias?.trim() || null,
        contact: req.body.contact?.trim() || null,
        phone: req.body.phone?.trim() || null,
        email: req.body.email?.trim() || null,
        uf: req.body.uf?.trim() || null,
        visibility: req.body.visibility?.trim() || null,
        initialCompetence: req.body.initialCompetence?.trim() || null,
      },
    })

    return res.status(201).json(client)
  } catch (error) {
    return next(error)
  }
})

router.patch(
  '/tenants/:tenantId/clients/:clientId',
  validateBody(clientUpdateSchema),
  async (req, res, next) => {
    try {
      const client = await prisma.client.findFirst({
        where: {
          id: req.params.clientId,
          tenantId: req.params.tenantId,
        },
      })
      if (!client) {
        return res.status(404).json({ message: 'Cliente não encontrado para este tenant.' })
      }

      const updated = await prisma.client.update({
        where: { id: client.id },
        data: {
          ...req.body,
          name: req.body.name?.trim(),
          alias: req.body.alias?.trim() || null,
          contact: req.body.contact?.trim() || null,
          phone: req.body.phone?.trim() || null,
          email: req.body.email?.trim() || null,
          uf: req.body.uf?.trim() || null,
          visibility: req.body.visibility?.trim() || null,
          initialCompetence: req.body.initialCompetence?.trim() || null,
        },
      })

      return res.json(updated)
    } catch (error) {
      return next(error)
    }
  },
)

router.delete('/tenants/:tenantId/clients/:clientId', async (req, res, next) => {
  try {
    const client = await prisma.client.findFirst({
      where: { id: req.params.clientId, tenantId: req.params.tenantId },
    })
    if (!client) {
      return res.status(404).json({ message: 'Cliente não encontrado para este tenant.' })
    }

    await prisma.client.delete({ where: { id: client.id } })
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

export default router
