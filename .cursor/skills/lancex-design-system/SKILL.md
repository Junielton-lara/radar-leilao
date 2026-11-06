---
name: lancex-design-system
description: >-
  Mantém a identidade visual do LanceX. Use ao criar ou ajustar telas,
  botões, campos, cards, tabelas, modais, menus, alertas, estados vazios,
  carregamento e feedback em apps/web.
---

# Design system LanceX

## Quando usar

Qualquer JSX de interface. Layout estreito e toque: skill `lancex-mobile-ux`. Esta skill é a consistência visual.

## Fonte

- Tokens: `apps/web/src/index.css` (`--color-bg`, `--color-bg-elevated`, `--color-bg-card`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-brand`, `--color-accent`, `--color-success`, `--color-warning`, `--color-danger`).
- Tailwind v4 via `@theme` no mesmo CSS — classes `bg-bg`, `bg-bg-card`, `text-text`, `text-text-muted`, `bg-brand`, `border-border`.
- Fonte: Nunito (`font-sans` / `font-display`).
- Ícones: `lucide-react` apenas.
- Primitivos: `apps/web/src/components/ui/` (`Button`, `Input`, …).
- Mobile: `apps/web/src/components/mobile/` (`BottomSheet`, `Fab`, `FormActionBar`, `MobileBottomNav`, `MobilePageHeader`).
- Superfície comum: classe utilitária `.card-soft`.

Não criar paleta nova, botão com `style` inline de cor de marca, nem outro pacote de componentes.

## Uso

- Ação principal: `Button` variant `default` (vermelho `brand`).
- Secundária: `secondary` ou `outline`. Terciária: `ghost`.
- Campo: `Input` (altura `h-12` para toque).
- Superfície: `.card-soft` / `bg-bg-card` sobre `bg-bg`. Não empilhar cards sem título.
- Status: cores `success` / `warning` / `danger` / `info` dos tokens.
- Modal de ações no mobile: `BottomSheet`. Não abrir um segundo padrão de diálogo.
- Lista vazia / carregando: skeleton (`.skeleton`) ou empty state curto. Erro: mensagem visível, não só console.

## Evitar

- Hex solto se o token existir.
- Vários cards de KPI sem hierarquia na mesma dobra no mobile.
- Ícone de outra biblioteca.
- Recriar botão, input ou sheet.
- Esconder conteúdo crítico só no mobile sem alternativa (filtro, KPI, CTA).

## Checklist

- [ ] Cores via token Tailwind / CSS variables
- [ ] Botão no variant certo para a função
- [ ] Ícone lucide no mesmo tamanho dos vizinhos (`h-4 w-4` na nav desktop, `h-5 w-5` na bottom nav / sheet)
- [ ] Vazio, loading e erro desenhados
- [ ] Contraste de texto `text`/`text-muted` sobre `bg-card`/`bg`

## Pronto quando

A tela usa os primitivos existentes, a ação principal é o vermelho da marca, e não há componente visual paralelo.
