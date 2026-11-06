---
name: lancex-mobile-ux
description: >-
  Garante usabilidade em celular, tablet e desktop no LanceX (PWA). Use ao
  criar ou corrigir páginas, formulários, tabelas, modais, navegação, mapa
  do radar, filtros, KPIs ou qualquer layout em apps/web/src.
---

# Mobile UX LanceX

## Quando usar

Qualquer interface nova ou alterada. Prioridade alta em radar/mapa, oportunidades, calendário, alertas e admin.

## Contexto

- Shell: `apps/web/src/layouts/app-shell.tsx` — sidebar só em `lg` (≥1024px); abaixo, drawer + `MobileBottomNav`. Conteúdo com `pb` + `safe-area-inset-bottom`.
- Nav: bottom nav (Mapa, Leilões, Agenda, Mais) em `apps/web/src/components/mobile/mobile-bottom-nav.tsx`.
- Breakpoint de componente: `useIsMobile()` em `apps/web/src/hooks/use-media-query.ts` é o inverso de `(min-width: 1024px)`.
- Primitivos mobile: `bottom-sheet.tsx`, `fab.tsx`, `form-action-bar.tsx`, `mobile-page-header.tsx`.
- Tokens: `apps/web/src/index.css`. PWA: `apps/web/vite.config.ts` + `index.html` (`viewport-fit=cover`).

## Regras

1. Desenhar a largura estreita primeiro, com os componentes atuais (`Button`, `Input`, `BottomSheet`, `Fab`, `FormActionBar`, `MobilePageHeader`).
2. Adaptar o mesmo componente. Não criar `FooMobile` se uma classe `lg:` resolver.
3. Sem scroll horizontal da página. Scroll local só dentro de tabela, mapa ou lista que não caiba em cards.
4. Tabela larga: cards abaixo de `lg`, tabela `hidden lg:block`.
5. Modal grande: virar sheet &lt;1024px via `BottomSheet`. Não modal fixo de 800px no celular.
6. Alvo de toque: `Button` default é `h-11`, `Input` é `h-12`. Evitar `size="sm"` como ação principal no celular.
7. Formulário em uma coluna; `sm:grid-cols-2` só quando os pares couberem.
8. Teclado: `type="tel"` / `email`, `inputMode="decimal"` | `numeric` | `search`.
9. Não descartar rascunho ao fechar sheet ou voltar.
10. `FormActionBar` e `Fab` não podem cobrir o último campo. O `Fab` usa `bottom` com safe area (acima da bottom nav).
11. Safe area: repetir `env(safe-area-inset-bottom)` só se o componente for fixo. O shell já reserva padding.
12. Campo focado visível com teclado. Se a barra fixa tapar, rolar o campo ou recolher a barra nesse passo.
13. Sheet, popover e menus não podem sair da viewport.
14. Mapa do radar: altura com `dvh`/`min-h`, overlays com `z-30+`, filtros flutuantes legíveis sobre o mapa, sem competir com a bottom nav.
15. Loading, erro e vazio em todas as larguras, não só no desktop.
16. Poucas media queries novas. Preferir utilitários Tailwind (`sm`, `md`, `lg`).
17. Foco visível, contraste dos tokens e botão com nome acessível.

## Checklist

Antes de concluir UI:

- [ ] Larguras 320, 360, 375, 390 e 430, mais tablet e desktop — no browser, se a ferramenta existir
- [ ] Teclado virtual nos campos numéricos, telefone, e-mail e busca
- [ ] Scroll da página e área de toque (≥44px)
- [ ] Modal, sheet e menu dentro da viewport
- [ ] Formulário longo com a nav inferior e a barra de ação
- [ ] Radar: filtros flutuantes e KPIs usáveis no celular
- [ ] Lint/build do web executados, ou falha relatada

Se não houver browser, dizer isso. Não afirmar teste visual.

## Pronto quando

O fluxo cabe em 320px sem scroll horizontal da página, as ações principais têm alvo confortável, overlays respeitam safe area + bottom nav, e a verificação feita (ou não feita) está explícita.
