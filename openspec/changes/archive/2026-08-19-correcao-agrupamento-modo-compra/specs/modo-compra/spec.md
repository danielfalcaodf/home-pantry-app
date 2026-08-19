## ADDED Requirements

### Requirement: Itens do Modo Compra agrupados sob cabeçalhos de categoria

O Modo Compra SHALL exibir os itens sob cabeçalhos de categoria, com a mesma organização que a
aba Lista. NÃO SHALL preservar a ordenação por categoria e omitir os cabeçalhos: ordem sem
rótulo é indistinguível de ordem arbitrária para quem está percorrendo os corredores do
mercado.

A organização SHALL reaproveitar a lógica já existente e testada
(`agruparListaPorCategoria` e `listaContinua`, em `src/presentation/format/agrupar-lista.ts`),
incluindo a regra de que o grupo "Sem categoria" aparece sempre por último. O Modo Compra SHALL
respeitar a mesma preferência de agrupamento da Lista (`usePreferenciaDeAgrupamento`): com o
agrupamento desligado, exibe lista contínua ordenada por nome, sem cabeçalhos.

Os cabeçalhos SHALL ser apenas rótulos de seção — não SHALL introduzir navegação, recolhimento
de grupo, nem qualquer controle, para não violar o requisito de tela única sem navegação
interna.

#### Scenario: Cabeçalhos presentes no Modo Compra

- **WHEN** o usuário inicia uma compra com itens de mais de uma categoria e o agrupamento está
  ativo
- **THEN** os itens aparecem sob os mesmos cabeçalhos de categoria que a aba Lista exibe

#### Scenario: Agrupamento desligado exibe lista contínua

- **WHEN** a preferência de agrupamento está desligada
- **THEN** o Modo Compra exibe os itens em lista única ordenada por nome, sem cabeçalhos, igual
  à aba Lista no mesmo estado

#### Scenario: "Sem categoria" por último também na compra

- **WHEN** a compra inclui itens avulsos ou produtos sem categoria
- **THEN** eles aparecem no grupo "Sem categoria", depois de todos os grupos de categoria

#### Scenario: Cabeçalho não é interativo

- **WHEN** o usuário toca num cabeçalho de categoria no Modo Compra
- **THEN** nada acontece: nenhuma navegação, nenhum recolhimento de grupo, nenhuma marcação

#### Scenario: Marcar item não reorganiza a tela

- **WHEN** o usuário marca um item como comprado
- **THEN** o item permanece no mesmo grupo e na mesma posição, e nenhum cabeçalho aparece ou
  desaparece
