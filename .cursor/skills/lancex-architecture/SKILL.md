---
name: lancex-architecture
description: >-
  Orienta mudanças no monorepo LanceX (API NestJS, web React/Vite, shared).
  Use ao criar módulos, rotas, jobs, integrações Tavily/IA ou deploy
  Vercel/Portainer.
---

# Arquitetura LanceX

## Layout

- `apps/api` — NestJS + Prisma + jobs (coleta, expiração, IA)
- `apps/web` — React + Vite + PWA + TanStack Query
- `packages/shared` — tipos e regras compartilhadas (categorias veiculares, disponibilidade no mapa)
- Deploy front: Vercel (`vercel.json` proxy `/api` → VPS)
- Deploy API/DB: Portainer/Hostinger

## Regras

1. Contratos compartilhados em `@lancex/shared` antes de duplicar tipos no front/API.
2. Chaves sensíveis só em env / Admin Integrações — nunca no git.
3. Front é PWA: mudanças de shell/nav/layout passam pela skill `lancex-mobile-ux`.
4. Mapa/radar: filtros de vigência e categorias no backend (`auction-map.filter`, bbox); front não inventa regra de negócio.
5. Após mudança de API em produção: rebuild Portainer; Vercel só cobre o web.

## Pronto quando

A mudança respeita os boundaries do monorepo, não quebra o proxy/CORS, e o impacto mobile/PWA foi considerado.
