import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = (process.env.SUPER_ADMIN_EMAIL || 'admin@hive.com').toLowerCase().trim()
  const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin123'
  const name = process.env.SUPER_ADMIN_NAME || 'Administrador Global'

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.tenantUser.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      tenantId: null,
    },
    create: {
      name,
      email,
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      tenantId: null,
    },
  })

  // Default tenant helps first setup for tests/imports.
  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: { name: 'Tenant Padrão', status: 'ACTIVE' },
    create: { name: 'Tenant Padrão', slug: 'default', status: 'ACTIVE' },
  })

  await prisma.tenantUser.upsert({
    where: { email: 'tenant.admin@hive.com' },
    update: {
      name: 'Admin Tenant',
      role: 'TENANT_ADMIN',
      isActive: true,
      tenantId: defaultTenant.id,
      passwordHash: await bcrypt.hash('Tenant123', 10),
    },
    create: {
      name: 'Admin Tenant',
      email: 'tenant.admin@hive.com',
      role: 'TENANT_ADMIN',
      isActive: true,
      tenantId: defaultTenant.id,
      passwordHash: await bcrypt.hash('Tenant123', 10),
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
