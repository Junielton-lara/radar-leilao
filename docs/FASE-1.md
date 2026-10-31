# FASE 1 — Diagnóstico e entrega

## Diagnóstico do repositório (pré-código)

- Workspace vazio (greenfield)
- Sem Git (não inicializado nesta fase, conforme solicitação)
- Sem stack ou módulos reaproveitáveis

## Decisões aprovadas

- Nome UI: **LanceX** · subtítulo **Radar Inteligente de Leilões** · **by +Gestor**
- Dark mode padrão, layout inspirado na referência visual
- Monorepo `apps/web` + `apps/api`
- Seed sem leilões fictícios

## O que foi implementado

### Backend

- NestJS modular (Auth, Users, Companies, Categories, Auctions, Radar, Settings, Health, Prisma)
- JWT access + refresh com hash SHA-256 e rotação
- RBAC (`ADMIN`, `ANALYST`, `USER`) + rate limit + Helmet + ValidationPipe + Swagger
- Prisma models alinhados ao escopo do produto (incl. PostGIS extension flag)
- Endpoints geográficos por bounding box (sem carregar tudo)
- Indicadores do radar sempre a partir do banco (zeros honestos)

### Frontend

- Shell com sidebar/header da referência (adaptado ao dark)
- Radar com MapLibre (Carto Dark Matter), filtros de categoria, KPIs, painéis laterais
- Login com React Hook Form + Zod
- Listagem e detalhe de oportunidades conectados à API
- Placeholders explícitos para áreas futuras

### Dados seed

- Admin
- 10 categorias
- 27 UFs na matriz `state_coverage`
- Integrações Tavily/AI como `active: false`

## Validação local executada

- `npm install --legacy-peer-deps`
- Migration `20261030181732_init` aplicada
- Seed: admin + 10 categorias + 27 UFs · 0 leilões
- Build API e Web OK
- Testes API (auth) e Web (utils) OK
- Health + login + indicators/coverage respondendo
- Docker Desktop indisponível neste host (serviço parado sem admin); usou PostgreSQL local 18 na porta 5432
- Compose permanece pronto com `postgres:16-alpine` + Redis (PostGIS full na imagem postgis quando houver espaço/Docker)

## Pendente (próximas fases)

- Marcadores reais (dependem da coleta)
- Cluster de marcadores, drawer mobile, bottom sheet
- Tavily, adapters, filas, IA, admin completo, PWA, E2E amplo
- Reabilitar imagem PostGIS quando o ambiente Docker estiver estável
