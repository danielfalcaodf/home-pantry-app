**Type:** Bug Fix

## Why

A tela de conferência (`app/conferencia.tsx`) é a única das 12 telas auditadas na campanha de QA sem nenhum botão "Voltar" — a única saída é o gesto/botão de sistema do Android (ACHADO-062, crítico). Isso viola um requisito **já existente** do spec `chrome-de-navegacao` ("Voltar da Conferência de estoque") — é lacuna de implementação, não de spec. Na mesma tela, o campo "Corrigir para" exibe um número que é só `placeholder`: tocar em "Corrigir" sem digitar é um no-op silencioso, sem nenhum feedback (ACHADO-055).

## What Changes

- Adicionar o `BotaoVoltar` padrão à tela de conferência, com o mesmo comportamento de preservação de progresso já garantido pela retomada (requisito "Conferência interrompível e retomável").
- Distinguir visualmente o placeholder do campo "Corrigir para" de um valor real digitado, eliminando a leitura equivocada de "já preenchido, pode confirmar direto".
- Cobrir os dois comportamentos com testes.

## Capabilities

### New Capabilities
(nenhuma)

### Modified Capabilities
- `modo-conferencia`: novo requisito de feedback explícito no campo de correção (placeholder nunca aparenta ser valor real; ação sem valor digitado não é um no-op ambíguo).

Nota: o botão Voltar da conferência já é exigido pelo spec `chrome-de-navegacao` existente (cenário "Voltar da Conferência de estoque") — a correção implementa o requisito, sem delta de spec.

## Impact

- `app/conferencia.tsx` — adicionar `BotaoVoltar` no topo do conteúdo; estilo/comportamento do campo "Corrigir para".
- Nenhum impacto em domínio, banco ou schema; `use-conferencia` já garante retomada (`use-conferencia.test.ts:112`).

### Dependencies between changes

Depende de `correcao-fuso-horario-testes` (ORDER.md 01) apenas pelo gate de testes verde. A tela `app/conferencia.tsx` também será tocada por `alvos-de-toque-e-acessibilidade` (ORDER.md 06) — esta change vem antes, e a 06 assume o Voltar já presente.
