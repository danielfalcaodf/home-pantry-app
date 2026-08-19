## Context

`Botao` ganhou a prop `numberOfLines` pela change `correcao-acabamento-header-stepper-e-
affordance` (Ordem 11), aplicada só em "Outra quantidade" pra evitar quebra de linha feia com
fonte ampliada. O efeito colateral é que, com container estreito, o texto trunca sempre — a
mudança resolveu o sintoma relatado (quebra feia) sem tocar na causa (largura insuficiente do
terceiro botão do grupo de três).

## Goals / Non-Goals

**Goals:**
- "Outra quantidade" (ou um rótulo equivalente) aparece legível por completo em fonte padrão.
- Não regredir a correção da change 11 (sem quebra de linha feia em fonte ampliada).

**Non-Goals:**
- Não redesenhar o grupo de três botões além do necessário para caber o texto.

## Decisions

- Preferir dar mais espaço ao terceiro botão (ajuste de `flex`) a abreviar o texto — abreviar
  muda o que o usuário lê, dar espaço não muda vocabulário nenhum. Só abreviar (ex.: "Outra
  qtd.") se o ajuste de `flex` prejudicar visualmente "Usei"/"Repus".
- Manter `numberOfLines={1}` como blindagem para fonte muito ampliada, mesmo depois do ajuste de
  espaço — evita regressão do achado original da change 11.

## Risks / Trade-offs

- [Risco] Dar mais `flex` ao terceiro botão pode espremer "Usei"/"Repus" → Mitigação: task de
  regressão compara os três botões lado a lado antes/depois, garantindo que nenhum perde
  legibilidade.
