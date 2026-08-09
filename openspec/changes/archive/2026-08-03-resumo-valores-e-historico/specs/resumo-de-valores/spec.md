## ADDED Requirements

### Requirement: Valor do estoque

O app SHALL exibir o valor total do que está em casa, calculado como a soma, sobre todos os produtos ativos e não removidos, da quantidade atual multiplicada pelo valor unitário.

#### Scenario: Soma sobre a despensa

- **WHEN** a despensa tem um produto com 2 unidades a R$ 8,90 e outro com 3 unidades a R$ 1,50
- **THEN** o valor do estoque exibido é R$ 22,30

#### Scenario: Produtos sem preço contribuem com zero

- **WHEN** um produto tem valor unitário zero
- **THEN** ele contribui com zero para o valor do estoque, sem invalidar o total

#### Scenario: Produtos removidos são excluídos

- **WHEN** existem produtos removidos logicamente
- **THEN** eles não entram no valor do estoque

#### Scenario: Conversão de unidades pela função única

- **WHEN** o valor do estoque é calculado
- **THEN** a multiplicação de quantidade por preço usa a função única de conversão do domínio, e o resultado está em centavos

### Requirement: Valor da lista de compras

O app SHALL exibir o valor estimado do que falta comprar, calculado como a soma dos custos de reposição dos itens abaixo do mínimo, usando a quantidade a comprar já arredondada.

#### Scenario: Soma dos custos de reposição

- **WHEN** dois itens estão em falta com custos de reposição de R$ 17,80 e R$ 22,50
- **THEN** o valor da lista exibido é R$ 40,30

#### Scenario: Quantidade arredondada usada no custo

- **WHEN** um item em unidade indivisível tem falta fracionária
- **THEN** o custo considera a quantidade arredondada para cima

#### Scenario: Nada faltando resulta em zero

- **WHEN** nenhum item está abaixo do mínimo
- **THEN** o valor da lista exibido é zero

### Requirement: Rótulos inequívocos e distintos

Os dois valores SHALL ser exibidos separadamente, com rótulos que impeçam confundir o que já está em casa com o que se vai gastar.

#### Scenario: Valores separados

- **WHEN** a tela de resumo é aberta
- **THEN** o valor do estoque e o valor da lista aparecem como dois números distintos, cada um com seu rótulo

#### Scenario: Rótulos não ambíguos

- **WHEN** os rótulos são lidos
- **THEN** fica claro qual valor representa o que está em casa e qual representa o que falta comprar

#### Scenario: Nenhum total combinado

- **WHEN** a tela de resumo é inspecionada
- **THEN** os dois valores NÃO são somados em um total único

### Requirement: Contagens de apoio

O resumo SHALL exibir a contagem de itens por estado e a contagem de itens sem preço cadastrado.

#### Scenario: Contagem por estado

- **WHEN** a despensa tem 3 itens zerados, 12 em falta e 50 completos
- **THEN** o resumo exibe as três contagens

#### Scenario: Itens sem preço sinalizados

- **WHEN** existem itens sem valor unitário cadastrado
- **THEN** o resumo informa quantos são, indicando que os valores exibidos são parciais

#### Scenario: Acesso a partir da contagem

- **WHEN** o usuário toca em uma contagem de estado
- **THEN** ele é levado à despensa já filtrada por aquele estado

### Requirement: Números grandes permitidos apenas aqui

Esta tela SHALL poder usar tipografia de maior destaque para os valores, respeitando o limite máximo da escala tipográfica. Todo número SHALL usar a família monoespaçada com figuras tabulares.

#### Scenario: Destaque dentro do limite

- **WHEN** os valores são exibidos em destaque
- **THEN** nenhum tamanho excede o máximo da escala tipográfica

#### Scenario: Família monoespaçada

- **WHEN** qualquer valor monetário é exibido
- **THEN** ele usa a família monoespaçada com figuras tabulares

#### Scenario: Sem contagem progressiva

- **WHEN** um valor é atualizado
- **THEN** ele troca diretamente para o novo valor, sem animação de contagem

### Requirement: Somente leitura

O resumo SHALL derivar todos os seus números em tempo de consulta, e NÃO deve persistir nenhum dos valores exibidos nem oferecer escrita.

#### Scenario: Nenhum valor persistido

- **WHEN** o schema é inspecionado
- **THEN** nenhuma coluna armazena valor de estoque, valor de lista ou gasto agregado

#### Scenario: Nenhuma ação de escrita

- **WHEN** a tela de resumo é usada
- **THEN** nenhuma escrita no banco ocorre
