# Hive Tarefas - Multi Tenant + Super Admin

Projeto com frontend React/Vite e backend Node/Express para operação em modo **multi-tenant** com **PostgreSQL**.

## Arquitetura

- `src/`: painel web atual (Vite + React)
- `backend/`: API REST com autenticação JWT, Prisma e PostgreSQL
- `docker-compose.yml`: ambiente de desenvolvimento
- `docker-compose.prod.yml`: ambiente de produção para `docker stack deploy`

## Backend (multi-tenant)

Modelos principais no banco:

- `Tenant`
- `TenantUser` (roles: `SUPER_ADMIN`, `TENANT_ADMIN`, `TENANT_USER`)
- `Client`
- `Task`

### Endpoints principais

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/super-admin/dashboard`
- `GET/POST/PATCH /api/super-admin/tenants`
- `GET /api/super-admin/tenants/:tenantId/users`
- `GET/POST/PATCH/DELETE /api/super-admin/tenants/:tenantId/clients`
- `GET /api/tenant/summary`
- `GET/POST /api/tenant/clients`
- `GET /api/tenant/tasks`

## Rodar em desenvolvimento (Docker Compose)

1. Copiar variáveis da API:

```bash
cp backend/.env.example backend/.env
```

2. Subir ambiente:

```bash
docker compose up -d
```

3. Acessos:

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000/api`
- Healthcheck: `http://localhost:4000/api/health`

### Usuários seed

- Super Admin:
  - Email: `admin@hive.com`
  - Senha: `Admin123`
- Admin Tenant padrão:
  - Email: `tenant.admin@hive.com`
  - Senha: `Tenant123`

## Produção com Docker Stack (Swarm)

1. Build e push das imagens:

```bash
docker build -t bitechgestao/tarefas-web:1.1 -f Dockerfile .
docker build -t bitechgestao/tarefas:1.1 -f backend/Dockerfile backend
docker push bitechgestao/tarefas-web:1.1
docker push bitechgestao/tarefas:1.1
```

2. Criar arquivo `.env.prod` baseado em `.env.prod.example`.

3. Deploy:

```bash
docker stack deploy -c docker-compose.prod.yml hive
```

## Execução local sem Docker

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd backend
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```
