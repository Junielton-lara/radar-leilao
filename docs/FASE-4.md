# FASE 4 — IA + antifraude

## Entregue

- **DocumentsModule** — metadados, download com proteção SSRF, hash SHA-256, extração PDF (`pdf-parse`)
- **AIEngineModule** — HTTP OpenAI-compatible; estágios identify / extract (Zod) / document summary / verification support
- Não inventa valores; conteúdo externo tratado como data (anti prompt-injection)
- **Não** aplica `VERIFICADO` sozinho — só sugestões
- **VerificationModule** — regras determinísticas + histórico; override admin com justificativa

## Requisitos live

- `OPENAI_API_KEY` ou `AI_API_KEY` (+ opcional `AI_BASE_URL`, `AI_MODEL`) ou IntegrationSetting provider `ai`
