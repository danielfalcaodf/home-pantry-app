---
id: ACHADO-063
pr: 10
change: 2026-08-03-ajuste-e-conferencia-estoque
capability: cadastro-de-produto
severidade: media
fase: F6
estado: virou-change
change-correcao: alvos-de-toque-e-acessibilidade
---
## O que quebra

Três alvos de toque abaixo do mínimo de 48×48dp (126px a 420dpi) nas telas de detalhe e cadastro de produto — mesma classe dos ACHADO-057/058/059 (R2, tabs), agora nas telas secundárias:

1. `produto/[id]`: botão "Corrigir quantidade atual" (a quantidade em display que abre o ajuste) — **100px/38dp** de altura.
2. `produto/[id]`: "Ver histórico completo" — **90px/34dp** de altura.
3. `produto/[id]` e `produto/novo` (componente compartilhado de cabeçalho): "Mais opções" — **58px/22dp**, o pior caso, idêntico ao padrão dos cabeçalhos das tabs (ACHADO-057/058).

## Como reproduzir

Abrir o detalhe de qualquer produto (ou o cadastro) e medir os bounds na hierarquia de acessibilidade (`maestro hierarchy`); comparar com o limiar de 126px.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

CLAUDE.md §Design de UI: "Alvos de toque mínimo 48×48dp, inclusive o stepper." O `BotaoReporRapido` e o stepper cumprem (126px); esses três botões não.

## Observado (saída real, caminho:linha)

Rodada F6-R3 no `emulator-5554` (420dpi): bounds reais de 100px, 90px e 58px de altura respectivamente. O toque-alvo do `Pressable` de "Corrigir quantidade atual" está em `app/produto/[id].tsx:185-194`.

## Change sugerida (slug proposto, escopo de uma frase)

`alvos-de-toque-minimos`: uma única change cobrindo todos os alvos <48dp do app (este achado + ACHADO-057/058/059) — padding/hitSlop até 48dp sem mudar o visual, começando pelos cabeçalhos compartilhados.
