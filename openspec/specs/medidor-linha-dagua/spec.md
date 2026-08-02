# medidor-linha-dagua

## Requirements

### Requirement: Linha de item como medidor vertical

Cada item da despensa SHALL ser renderizado como uma linha de 68 pontos de altura, com raio zero, indo de borda a borda, preenchida com a cor do estado em opacidade reduzida a partir da base, na fração de preenchimento fornecida pelo domínio. A lista NÃO deve usar cards, bordas ou sombras.

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

### Requirement: Cálculo de estado feito no domínio

O componente SHALL receber estado, fração e rótulo já calculados. Ele NÃO deve derivar estado, calcular proporção nem limitar a fração.

#### Scenario: Componente recebe valores prontos

- **WHEN** o componente de item é inspecionado
- **THEN** ele não contém aritmética sobre quantidade atual e necessária

#### Scenario: Fração já limitada na origem

- **WHEN** um produto tem quantidade acima da necessária
- **THEN** a fração recebida pelo componente já é 1, sem necessidade de limitação no estilo

### Requirement: Três canais redundantes de estado

O estado de cada item SHALL ser comunicado simultaneamente por altura de preenchimento, cor da régua e rótulo textual. A informação NÃO deve depender exclusivamente de cor.

#### Scenario: Rótulo textual presente

- **WHEN** qualquer item é renderizado
- **THEN** seu rótulo de estado é exibido em texto

#### Scenario: Legível sem distinção de cores

- **WHEN** a interface é observada sem distinguir cores
- **THEN** o estado de cada item permanece determinável pela altura da tinta e pelo rótulo

### Requirement: Estrutura e toques da linha de item

A linha SHALL apresentar, à esquerda, o nome do item, a categoria com a unidade, e a leitura de quantidade com o rótulo de estado; à direita, o alvo do botão de consumo. Toque na área esquerda SHALL abrir o detalhe do produto.

#### Scenario: Toque na esquerda abre o detalhe

- **WHEN** o usuário toca na área de texto da linha
- **THEN** a tela de detalhe daquele produto é aberta

#### Scenario: Alvo do botão reservado mesmo quando inativo

- **WHEN** um item está no estado crítico e o botão de consumo não tem função
- **THEN** o botão permanece na linha com opacidade reduzida, e o alinhamento vertical da lista não muda

#### Scenario: Sem gesto de deslizar

- **WHEN** o usuário desliza horizontalmente sobre uma linha
- **THEN** nenhuma ação é disparada

#### Scenario: Leitura de quantidade usa família monoespaçada

- **WHEN** a quantidade do item é renderizada
- **THEN** ela usa o papel tipográfico de dado, com figuras tabulares

### Requirement: Rótulo acessível descritivo

Cada linha SHALL expor ao leitor de tela um rótulo que descreve nome, quantidade atual, quantidade necessária e estado. O botão de consumo SHALL ser rotulado pela ação completa, e NÃO apenas por seu símbolo.

#### Scenario: Rótulo da linha

- **WHEN** o leitor de tela alcança uma linha de item
- **THEN** ele anuncia o nome, a leitura de quantidade e o estado

#### Scenario: Rótulo do botão

- **WHEN** o leitor de tela alcança o botão de consumo
- **THEN** ele anuncia a ação completa com o nome do produto e a unidade, nunca apenas "menos"

### Requirement: Sem animação durante a rolagem

O nível SHALL ser pintado diretamente no valor final ao renderizar. A tinta NÃO deve animar durante a rolagem nem na entrada dos itens na tela.

#### Scenario: Rolagem não anima níveis

- **WHEN** o usuário rola a lista
- **THEN** os níveis aparecem já no valor final, sem transição

#### Scenario: Sem entrada em cascata

- **WHEN** a tela da despensa é aberta
- **THEN** os itens aparecem simultaneamente, sem animação escalonada e sem esqueleto de carregamento
