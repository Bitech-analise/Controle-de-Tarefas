import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import env from './config/env.js'
import healthRoutes from './routes/health.routes.js'
import authRoutes from './routes/auth.routes.js'
import superAdminRoutes from './routes/super-admin.routes.js'
import tenantRoutes from './routes/tenant.routes.js'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: env.allowedOrigin === '*' ? true : env.allowedOrigin.split(',').map((item) => item.trim()),
    credentials: true,
  }),
)
app.use(express.json({ limit: '4mb' }))
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))

app.get('/', (_req, res) => {
  res.json({ service: 'hive-tarefas-api', status: 'running' })
})

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/super-admin', superAdminRoutes)
app.use('/api/tenant', tenantRoutes)

app.use((req, res) => {
  res.status(404).json({ message: `Rota não encontrada: ${req.method} ${req.originalUrl}` })
})

app.use((error, _req, res, _next) => {
  const prismaUniqueErrorCode = 'P2002'
  if (error?.code === prismaUniqueErrorCode) {
    return res.status(409).json({ message: 'Registro já existe com os mesmos dados únicos.' })
  }

  console.error(error)
  return res.status(500).json({
    message: 'Erro interno no servidor.',
    detail: env.nodeEnv === 'development' ? error.message : undefined,
  })
})

export default app
