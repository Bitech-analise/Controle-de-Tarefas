import app from './app.js'
import env from './config/env.js'
import prisma from './lib/prisma.js'

const server = app.listen(env.port, () => {
  console.log(`API Hive Tarefas rodando na porta ${env.port}`)
})

server.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    console.error(`Porta ${env.port} já está em uso. Finalize o processo atual ou altere o PORT.`)
  } else {
    console.error('Falha ao iniciar API.', error)
  }
  process.exit(1)
})

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
