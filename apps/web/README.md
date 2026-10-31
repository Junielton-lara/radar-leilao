# LanceX Web (`@lancex/web`)

Frontend do **LanceX — Radar Inteligente de Leilões** (by +Gestor).

## Stack

- React 19 + Vite 6 + TypeScript
- TanStack Query + React Router 7
- MapLibre GL (mapa + clustering GeoJSON)
- Tailwind CSS 4
- PWA via `vite-plugin-pwa`

## Setup

```bash
# na raiz do monorepo
npm install
npm run dev -w @lancex/web
```

Variáveis (`.env`):

```
VITE_API_URL=http://localhost:3001/api/v1
```

Auth: token em `localStorage.lancex_access_token`.

## Rotas principais

| Rota | Descrição |
|------|-----------|
| `/login` | Autenticação |
| `/` · `/radar` | Radar visual (mapa/lista, filtros, legendas) |
| `/oportunidades` | Listagem |
| `/oportunidades/:id` | Detalhe com abas |
| `/configuracoes` | Produto + integrações |
| `/admin/*` | Área ADMIN (dashboard, fontes, coletas, revisão, filas, integrações) |

## Fases cobertas neste app

- **FASE 2** — Radar: clustering MapLibre, filtros avançados (debounce), toggle mapa/lista, detalhe com abas, filtros salvos (API ou `localStorage`), drawer mobile, legenda.
- **FASE 6** — Admin UI (role `ADMIN` only), stubs tipados para endpoints ainda não publicados.
- **FASE 7** — PWA (manifest + service worker), shell mobile com burger, `data-testid` em login/radar/filtros.

## Build

```bash
npm run build -w @lancex/web
```

## Test IDs (e2e)

- Login: `login-page`, `login-email`, `login-password`, `login-submit`
- Radar: `radar-page`, `radar-map`, `radar-filters-open`, `radar-filters`, `radar-view-toggle`
- Shell: `mobile-menu-button`, `nav-admin`
