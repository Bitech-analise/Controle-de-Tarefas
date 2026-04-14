import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import env from '../config/env.js'
import { validateBody } from '../middlewares/validate.js'
import { requireAuth } from '../middlewares/auth.js'

const router = Router()

const loginSchema = z
  .object({
    login: z.string().trim().min(2).optional(),
    email: z.string().trim().optional(),
    password: z.string().min(4),
  })
  .superRefine((value, ctx) => {
    const rawLogin = String(value.login || value.email || '').trim()
    if (!rawLogin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe usuario ou e-mail.',
        path: ['login'],
      })
    }
  })

router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { password } = req.body
    const rawLogin = String(req.body.login || req.body.email || '').trim()
    const normalizedLogin = rawLogin.toLowerCase()
    const isEmailLogin = normalizedLogin.includes('@')

    const user = isEmailLogin
      ? await prisma.tenantUser.findUnique({
          where: { email: normalizedLogin },
          include: { tenant: true },
        })
      : await prisma.tenantUser.findFirst({
          where: { username: normalizedLogin },
          include: { tenant: true },
        })

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Usuario ou senha invalidos.' })
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash)
    if (!passwordOk) {
      return res.status(401).json({ message: 'Usuario ou senha invalidos.' })
    }

    if (user.role !== 'SUPER_ADMIN' && (!user.tenant || user.tenant.status !== 'ACTIVE')) {
      return res.status(403).json({ message: 'Tenant inativo.' })
    }

    const payload = {
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId || null,
      email: user.email,
      username: user.username || null,
      name: user.name,
    }

    const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn })

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username || null,
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
      return res.status(401).json({ message: 'Usuario nao encontrado.' })
    }

    return res.json({
      id: user.id,
      name: user.name,
      username: user.username || null,
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
