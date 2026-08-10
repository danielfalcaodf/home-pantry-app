---
id: ACHADO-064
pr: 10
change: 2026-08-03-ajuste-e-conferencia-estoque
capability: historico-do-produto
severidade: baixa
fase: F6
estado: virou-change
change-correcao: alvos-de-toque-e-acessibilidade
---
## O que quebra

Na tela `produto/[id]/historico`, cada linha de movimento expõe ação, quantidade e data como **três `TextView`s soltos** na árvore de acessibilidade, sem agrupamento (`accessible`/`accessibilityLabel` combinado no contêiner da linha). Um usuário de TalkBack ouve três fragmentos desconexos ("Usei", "3 pacotes", "09/08/2026 às 20:23") em três paradas de foco, em vez de uma leitura única ("Usei 3 pacotes, 9 de agosto às 20:23").

## Como reproduzir

Abrir o histórico de qualquer produto com movimentos e inspecionar a hierarquia: as linhas não têm nó agrupador acessível, diferente do `ItemDespensa` (que agrupa nome+leitura+estado num único `accessibilityLabel`, `item-despensa.tsx:73`).

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

Mesmo padrão já aplicado (e testado) no `ItemDespensa` — "anuncia nome+leitura+estado juntos" (`medidor-e-item.test.tsx:71`). O spec de `historico-do-produto` define o conteúdo de cada linha como uma unidade de informação.

## Observado (saída real, caminho:linha)

Rodada F6-R3 no `emulator-5554`: hierarquia da tela de histórico com três `TextView`s por linha, sem contêiner acessível agrupado.

## Change sugerida (slug proposto, escopo de uma frase)

`a11y-agrupar-linha-historico`: agrupar cada linha do histórico num contêiner `accessible` com rótulo combinado, seguindo o padrão do `ItemDespensa`.
