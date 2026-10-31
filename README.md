# LanceX — Radar Inteligente de Leilões do Brasil

Plataforma SaaS de inteligência, coleta, processamento e monitoramento contínuo de leilões públicos e privados no Brasil.

**by +Gestor**

## Status

**Fases 1–7 implementadas** (ver `docs/FASES-2-7.md` e `docs/FASE-1.md`).

Entregue:

- Monorepo `apps/api` + `apps/web` + `packages/shared`
- Auth JWT/refresh/RBAC, Prisma, Radar MapLibre com cluster/filtros
- Motor de coleta (Tavily + adapters), IA, verificação determinística
- BullMQ/cron (fallback sem Redis), admin UI, PWA
- Sem leilões fictícios; Tavily/IA só operam com chave configurada

## Pré-requisitos

- Node.js 20+
- PostgreSQL 16+ (local) **ou** Docker Desktop
- Redis opcional na FASE 1 (obrigatório a partir da FASE 5)

## Subir ambiente local

```bash
# 1) Dependências
npm install --legacy-peer-deps

# 2) Infra (Docker — preferencial)
npm run db:up
# Se a porta 5432 já estiver ocupada, o compose usa 5433.
# Alternativa: PostgreSQL local com DB/usuário lancex/lancex na 5432.

# 3) Shared + Prisma
npm run build:shared
npm run db:generate
cd apps/api && npx prisma migrate dev --name init && npm run prisma:seed && cd ../..

# 4) Dev
npm run dev:api
npm run dev:web
```

- Web: http://localhost:5173
- API: http://localhost:3001/api/v1
- Swagger: http://localhost:3001/api/docs

### Credenciais seed

- E-mail: `admin@lancex.app`
- Senha: `ChangeMeAdmin123!`

## Estrutura

```
APP/
├── apps/api          NestJS + Prisma
├── apps/web          React + Vite + Tailwind + MapLibre
├── packages/shared   Tipos, enums, schemas Zod
├── docker            PostGIS + Redis
└── docs              Arquitetura e fases
```

## Próximas fases

- FASE 2 — Radar visual avançado (cluster, filtros completos, detalhes ricos)
- FASE 3 — Motor de coleta + Tavily
- FASE 4 — IA + antifraude
- FASE 5 — BullMQ/workers/cron
- FASE 6 — Administração
- FASE 7 — PWA, hardening, E2E, deploy
