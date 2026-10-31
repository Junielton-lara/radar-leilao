# FASE 5 — BullMQ / workers / cron

## Entregue

- **JobsModule** — filas: discovery, extraction, document-processing, ai-analysis, verification, geocoding, monitoring, notification
- Retry exponencial + concorrência por fila
- Se Redis cair: fallback inline (processa no request) + crons `@nestjs/schedule` no-op quando integrações desligadas
- **GeolocationModule** — stub de fila/helper (bbox já na FASE 1)
- Admin: `GET /admin/jobs/stats`

## Requisitos live

- Redis em `REDIS_URL` (default `redis://localhost:6379`)
- Sem Redis a API sobe normalmente; jobs rodam inline
