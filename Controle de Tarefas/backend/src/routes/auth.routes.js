import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import env from '../config/env.js'
import { validateBody } from '../middlewares/validate.js'
import { requireAuth } from '../middlewares/auth.js'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
})

router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body
    const normalizedEmail = email.toLowerCase().trim()

    const user = await prisma.tenantUser.findUnique({
      where: { email: normalizedEmail },
      include: { tenant: true },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Usuário ou senha inválidos.' })
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash)
    if (!passwordOk) {
      return res.status(401).json({ message: 'Usuário ou senha inválidos.' })
    }

    if (user.role !== 'SUPER_ADMIN' && (!user.tenant || user.tenant.status !== 'ACTIVE')) {
      return res.status(403).json({ message: 'Tenant inativo.' })
    }

    const payload = {
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId || null,
      email: user.email,
      name: user.name,
    }

    const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn })

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name || null,
        clientIds: user.clientIds,
      },
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.tenantUser.findUnique({
      where: { id: req.auth.sub },
      include: { tenant: true },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Usuário não encontrado.' })
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: user.tenant?.name || null,
      clientIds: user.clientIds,
    })
  } catch (error) {
    return next(error)
  }
})

export default router
