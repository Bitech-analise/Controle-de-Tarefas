import jwt from 'jsonwebtoken'
import env from '../config/env.js'

export function requireAuth(req, res, next) {
  const raw = req.headers.authorization || ''
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : ''

  if (!token) {
    return res.status(401).json({ message: 'Token não informado.' })
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret)
    req.auth = payload
    return next()
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado.' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ message: 'Autenticação obrigatória.' })
    }

    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ message: 'Sem permissão para esta ação.' })
    }

    return next()
  }
}

export function resolveTenantFromAuth(req, fallbackTenantId = null) {
  if (req.auth?.role === 'SUPER_ADMIN') {
    return fallbackTenantId
  }
  return req.auth?.tenantId || null
}
