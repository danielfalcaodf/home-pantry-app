## Context

Todos os sheets do app usam o mesmo componente base `PainelInferior` sobre `Modal` nativo. O
padrão de affordance (foco automático no primeiro campo ao abrir) já foi estabelecido e
aplicado a 3 dos 5 sheets com campo de texto numa change anterior; `sheet-ajuste-compra` e
`sheet-ajuste-estoque` ficaram de fora por não terem sido cobertos naquele levantamento.

## Goals / Non-Goals

**Goals:**
- Os 2 sheets restantes seguem o mesmo padrão de affordance dos outros 3.

**Non-Goals:**
- Não mexer no componente `PainelInferior`/`Modal` em si — é só a prop `autoFocus` faltando em
  cada `CampoTexto`.

## Decisions

- Adicionar `autoFocus` diretamente ao `CampoTexto`, mesma abordagem usada nos outros 3 sheets
  (sem abstrair em `PainelInferior`, para não arriscar afetar sheets sem campo de texto).

## Risks / Trade-offs

- Nenhum risco relevante — mudança de 1 prop por arquivo, mesmo padrão já validado no app.
