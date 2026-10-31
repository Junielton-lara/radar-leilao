# Fases 2–7 — Entrega consolidada

## FASE 2 — Radar visual
- Cluster MapLibre (GeoJSON)
- Filtros avançados (drawer/painel) com debounce
- Alternância mapa/lista
- Legenda de categorias/status
- Detalhe com abas (visão geral, valores, datas, lotes, documentos, IA, histórico)
- Filtros salvos (API + fallback localStorage)

## FASE 3 — Coleta
- Sources CRUD + trigger de discovery
- TavilyService (search/extract, cache, limites, sem chave = indisponível)
- Adapters (Tavily, Manual, stubs governamentais honestos)
- Discovery runs + StateCoverage real
- Deduplicação por URL canônica / similaridade (sem apagar)

## FASE 4 — IA + antifraude
- AI Engine OpenAI-compatible + schema Zod
- Análise por leilão (não inventa valores)
- Verification rules determinísticas (`applyVerificationRules`)
- Override manual com justificativa + histórico
- Documentos com SSRF guard + pdf-parse quando possível

## FASE 5 — Automação
- BullMQ + Redis (fallback inline se Redis offline)
- Filas: discovery, extraction, documents, ai, verification, geocoding, monitoring, notification
- Crons configuráveis (discovery / monitoring / status)
- Relatório diário `/reports/daily`

## FASE 6 — Admin
- `/admin/dashboard` métricas reais
- UI Admin: fontes, coletas, revisão, filas, integrações (chaves mascaradas)
- Settings PUT integrações

## FASE 7 — Finalização
- PWA (vite-plugin-pwa)
- Shell responsivo + nav Admin
- data-testid em pontos-chave
- Builds API/Web e testes unitários OK

## Operação
- Sem `TAVILY_API_KEY` / `AI_API_KEY`: integrações reportam não configuradas e recusam coleta/análise.
- Cobertura nacional só quando as 27 UFs tiverem `lastSearchedAt`.
