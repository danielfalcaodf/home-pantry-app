## MODIFIED Requirements

### Requirement: Linha de item como medidor vertical

Cada item da despensa SHALL ser renderizado como uma linha de 68 pontos de altura, com raio zero, indo de borda a borda, preenchida com a cor do estado em opacidade reduzida a partir da base, na fração de preenchimento fornecida pelo domínio. A lista NÃO deve usar cards, bordas ou sombras — o estilo de `item-despensa.tsx` NÃO deve declarar `shadowColor`, `shadowOpacity` nem `elevation`, e `borderRadius` deve ser zero.

#### Scenario: Preenchimento proporcional

- **WHEN** um item tem fração de preenchimento de dois terços
- **THEN** a tinta ocupa dois terços da altura da linha, a partir da base

#### Scenario: Régua marca a superfície

- **WHEN** um item tem preenchimento parcial
- **THEN** uma régua de 2 pontos na cor cheia do estado é desenhada no topo da tinta

#### Scenario: Item zerado não tem tinta

- **WHEN** um item está no estado crítico
- **THEN** nenhuma tinta é desenhada e apenas a régua de 2 pontos aparece na base, na cor crítica

#### Scenario: Item cheio não transborda

- **WHEN** um item tem quantidade acima da necessária
- **THEN** a tinta ocupa exatamente a altura total e a régua fica rente ao topo, sem extravasar a linha

#### Scenario: Sobra é marcada discretamente

- **WHEN** um item tem quantidade acima da necessária
- **THEN** um traço de 1 ponto acima da régua indica a sobra, sem número e sem etiqueta

#### Scenario: Sem contêiner visual

- **WHEN** a lista é renderizada
- **THEN** nenhuma linha possui card, borda arredondada ou sombra; as linhas são separadas por divisores de 1 ponto

#### Scenario: Ausência de sombra e elevação comprovável por leitura de estilo

- **WHEN** o arquivo de origem de `item-despensa.tsx` é inspecionado
- **THEN** ele não contém `shadowColor`, `shadowOpacity` nem `elevation`, e nenhum `borderRadius` diferente de zero

### Requirement: Sem animação durante a rolagem

O nível SHALL ser pintado diretamente no valor final ao renderizar. A tinta NÃO deve animar durante a rolagem nem na entrada dos itens na tela. A tinta SHALL animar **exclusivamente** quando a quantidade daquele item mudar por ação do usuário. Esse controle SHALL ser explícito na prop `animar` de `MedidorNivel`: com `animar={false}` o nível assume o valor final diretamente; com `animar={true}` o nível usa física de mola (`molar()`).

#### Scenario: Rolagem não anima níveis

- **WHEN** o usuário rola a lista
- **THEN** os níveis aparecem já no valor final, sem transição

#### Scenario: Sem entrada em cascata

- **WHEN** a tela da despensa é aberta
- **THEN** os itens aparecem simultaneamente, sem animação escalonada e sem esqueleto de carregamento

#### Scenario: Mudança de quantidade anima

- **WHEN** o usuário registra um consumo em um item
- **THEN** o nível daquele item desce até o novo valor com física de mola

#### Scenario: Apenas o item alterado anima

- **WHEN** o usuário registra um consumo em um item
- **THEN** nenhum outro item da lista anima seu nível

#### Scenario: Reordenação após mudança de estado não anima o nível

- **WHEN** um item muda de estado e sua posição na lista muda
- **THEN** seu nível é pintado no valor final na nova posição, sem animar por causa da reordenação

#### Scenario: Prop `animar` controla o mecanismo diretamente

- **WHEN** `MedidorNivel` é renderizado com `animar={false}` e depois com `animar={true}` para a mesma mudança de fração
- **THEN** apenas o segundo caso invoca a física de mola (`molar()`); o primeiro assume o valor final sem chamada a `molar()`
