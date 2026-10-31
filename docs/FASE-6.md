# FASE 6 — Administração

## Entregue

- **AdminModule** — `GET /admin/dashboard` (status, fontes, UFs, buscas, falhas, créditos Tavily/AI, jobs) — `RolesGuard` ADMIN
- **ReportsModule** — resumo executivo diário com contagens reais do DB
- **NotificationsModule** — create/list/mark-read + scaffold de alertas
- **Settings** — `PUT /settings/integrations` grava chave criptografada; resposta só com máscara; limites Tavily/AI

## Segurança

- Chaves nunca retornadas ao frontend após save
- Credenciais em `credentials_enc` (AES-256-GCM)
