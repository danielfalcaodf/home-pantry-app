# regras-de-compra

## Requirements

### Requirement: Total pago de uma compra

O domínio SHALL calcular o total pago de uma compra somando, para cada item marcado como comprado, a quantidade comprada multiplicada pelo valor pago unitário. Itens não marcados NÃO devem entrar no total.

#### Scenario: Soma de itens marcados

- **WHEN** a compra tem um item marcado de 2000 milésimos a 890 centavos e outro marcado de 1000 milésimos a 2250 centavos
- **THEN** o total pago é 4030 centavos

#### Scenario: Item não marcado é ignorado

- **WHEN** a compra tem um item marcado e um item não marcado
- **THEN** o total pago considera apenas o item marcado

#### Scenario: Compra sem itens marcados

- **WHEN** nenhum item da compra está marcado
- **THEN** o total pago é 0

#### Scenario: Item marcado sem preço pago

- **WHEN** um item está marcado como comprado e o valor pago unitário é 0
- **THEN** ele contribui com 0 para o total e não invalida o cálculo

### Requirement: Efeito de reposição de um item comprado

O domínio SHALL calcular, para cada item marcado, a nova quantidade do produto como a quantidade atual somada à quantidade comprada, e o movimento de reposição correspondente.

#### Scenario: Reposição soma ao estoque

- **WHEN** o produto tem 500 milésimos e o item comprado é de 2000 milésimos
- **THEN** a nova quantidade é 2500 milésimos e o movimento gerado é uma reposição de +2000

#### Scenario: Reposição de item avulso não afeta estoque

- **WHEN** o item comprado não referencia nenhum produto do estoque
- **THEN** nenhum efeito de reposição é gerado e nenhum movimento é produzido

#### Scenario: Item marcado com quantidade comprada diferente da planejada

- **WHEN** a quantidade planejada é 3000 e a quantidade comprada informada é 2000
- **THEN** o efeito de reposição usa 2000, e não a planejada

### Requirement: Decisão de atualizar preço de referência

O domínio SHALL detectar quando o valor pago unitário difere do valor unitário cadastrado do produto, para que a interface possa perguntar ao usuário. A atualização do preço de referência SHALL ocorrer **apenas** mediante confirmação explícita.

#### Scenario: Preço divergente é detectado

- **WHEN** o valor unitário cadastrado é 890 e o valor pago é 950
- **THEN** o domínio sinaliza divergência de preço para aquele item

#### Scenario: Preço igual não gera pergunta

- **WHEN** o valor pago é igual ao valor unitário cadastrado
- **THEN** nenhuma divergência é sinalizada

#### Scenario: Sem confirmação o preço permanece

- **WHEN** há divergência e o usuário não confirma a atualização
- **THEN** o valor unitário do produto permanece inalterado

#### Scenario: Com confirmação o preço é atualizado

- **WHEN** há divergência e o usuário confirma a atualização
- **THEN** o novo valor unitário do produto passa a ser o valor pago

#### Scenario: Produto sem preço cadastrado

- **WHEN** o valor unitário cadastrado é 0 e um valor pago maior que zero é informado
- **THEN** a divergência é sinalizada, permitindo que o primeiro preço seja registrado mediante confirmação

### Requirement: Atomicidade da finalização

O domínio SHALL expor a finalização de compra como um único conjunto de efeitos calculado de uma vez — reposições, atualizações de preço confirmadas e o total pago — de modo que a camada de persistência possa aplicá-lo em uma única transação.

#### Scenario: Efeitos calculados em bloco

- **WHEN** a finalização de uma compra com três itens marcados é calculada
- **THEN** o resultado contém as três reposições, as atualizações de preço confirmadas e o total pago, em uma única estrutura

#### Scenario: Falha de validação impede efeito parcial

- **WHEN** qualquer item marcado tem quantidade comprada ausente
- **THEN** o resultado é falha e nenhum efeito é produzido para nenhum item
