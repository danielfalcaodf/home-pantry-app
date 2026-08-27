## Context

Todos os sheets do app usam o mesmo componente base `PainelInferior` sobre `Modal` nativo. O
padrão de affordance (foco automático no primeiro campo ao abrir) já foi estabelecido e
aplicado a 3 dos 5 sheets com campo de texto numa change anterior; `sheet-ajuste-compra` e
`sheet-ajuste-estoque` ficaram de fora por não terem sido cobertos naquele levantamento.

## Goals / Non-Goals

**Goals:**
- Os 2 sheets restantes seguem o mesmo padrão de affordance dos outros 3.

**Non-Goals (revisado em 2026-08-21 — ver Decisions):**
- ~~Não mexer no componente `PainelInferior`/`Modal` em si~~ — necessário, é onde mora a causa
  raiz real.
- ~~Corrigir `sheet-preco-produto`, `sheet-avulso` e `teclado-quantidade`~~ — trazido pra dentro
  do escopo a pedido do usuário, ver Decisions.

## Decisions

- ~~Adicionar `autoFocus` diretamente ao `CampoTexto`, mesma abordagem usada nos outros 3
  sheets (sem abstrair em `PainelInferior`, para não arriscar afetar sheets sem campo de
  texto).~~ **Revisado em 2026-08-21**: `autoFocus` na montagem é a causa raiz do bug real
  (teclado não sobe em dispositivo físico) — não dá pra manter essa decisão. Substituída por:
  `PainelInferior` ganha a prop opcional `onAberto` (chamada a partir do `onShow` nativo do
  `Modal`, com um atraso curto documentado no componente), e cada sheet passa um `ref` do seu
  primeiro campo. Sheets sem campo de texto simplesmente não passam `onAberto` — sem risco de
  afetá-los, contrariando a preocupação original.
- A mesma correção foi estendida, a pedido do usuário, aos 3 sheets que compartilhavam o
  defeito pré-existente (`sheet-preco-produto`, `sheet-avulso`, `teclado-quantidade`) — decisão
  original de tratá-los como "fora de escopo" (ver Non-Goals abaixo) revertida porque a causa
  raiz já estava resolvida e o custo marginal de aplicar o mesmo padrão era baixo.

## Risks / Trade-offs

- O atraso de foco (`ATRASO_FOCO_APOS_ABRIR_MS` em `painel-inferior.tsx`) é uma heurística de
  timing, não uma condição observável — o Android não expõe um evento "janela pronta pra IME".
  Validado repetidamente no emulador; pode precisar de ajuste fino se aparecer flakiness em
  dispositivo físico real (ver tasks.md §6.1.4, ainda pendente).
