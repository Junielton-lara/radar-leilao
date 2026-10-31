# FASE 3 — Motor de coleta + Tavily

## Entregue

- **SourcesModule** — CRUD de fontes + `POST /sources/:id/discover`
- **TavilyModule** — search/extract/map/crawl reais; status honesto sem chave; cache diário (`tavily_cache`); limites daily/monthly; usage log
- **DiscoveryModule** — `SourceAdapter` + Tavily/Manual + stubs (gov/diários/etc. sem scraping ilegal)
- Orquestração UF × categoria → `SearchRun` / `SearchRunItem` → candidatos `Auction`
- Deduplicação por URL canônica e similaridade organizador+procedimento (`auction_duplicate_links`) — sem apagar leilões
- `StateCoverage` atualizado só quando a UF foi de fato pesquisada

## Requisitos para coleta live

- `TAVILY_API_KEY` ou credencial criptografada em `IntegrationSetting` (provider `tavily`) + `active: true`
- Limites em `configJson.dailyLimit` / `monthlyLimit`

## Validação

- Sem chave: endpoints de status/recusa claros (`TAVILY_NOT_CONFIGURED`)
- Unit tests: dedupe + tavily cost guard
