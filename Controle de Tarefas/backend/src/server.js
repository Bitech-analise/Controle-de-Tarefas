import app from './app.js'
import env from './config/env.js'
import prisma from './lib/prisma.js'

const server = app.listen(env.port, () => {
  console.log(`API Hive Tarefas rodando na porta ${env.port}`)
})

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
