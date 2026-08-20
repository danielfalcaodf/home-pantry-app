# modo-compra

## MODIFIED Requirements

### Requirement: Ajuste de quantidade comprada e preço pago

Ao marcar um item, o usuário SHALL poder ajustar a quantidade realmente comprada e o valor
pago por unidade. Sem ajuste, a quantidade planejada SHALL ser assumida como comprada, e o
preço estimado do produto (quando existir) SHALL ser assumido como preço pago. Ao reabrir uma
compra aberta com item já materializado e não comprado, o preço estimado desse item SHALL ser
sincronizado com o preço atual do produto, caso tenha mudado desde a materialização.

#### Scenario: Padrão assume o planejado

- **WHEN** um item é marcado sem ajuste
- **THEN** a quantidade comprada assumida é a planejada

#### Scenario: Quantidade ajustada

- **WHEN** o usuário informa uma quantidade comprada diferente da planejada
- **THEN** o valor informado é o considerado na reposição e no total

#### Scenario: Preço pago informado

- **WHEN** o usuário informa o valor pago por unidade
- **THEN** o total corrente é recalculado com esse valor, sobrescrevendo qualquer preço
  estimado assumido por padrão

#### Scenario: Preço pago ausente com preço estimado no produto

- **WHEN** o item é marcado sem informar preço pago e o produto tem preço estimado
  (`valorEstimadoUnit`)
- **THEN** o preço estimado é gravado como preço pago e contribui para o total corrente

#### Scenario: Preço pago ausente

- **WHEN** o item é marcado sem informar preço pago e o produto não tem preço estimado
- **THEN** ele contribui com zero para o total corrente e não impede o fechamento

#### Scenario: Preço editado depois da materialização é sincronizado ao reabrir a compra

- **WHEN** um item já foi materializado numa compra aberta com preço estimado zero, o preço do
  produto é editado (na Lista ou na Despensa), e a compra é reaberta antes de finalizar
- **THEN** o preço estimado desse item passa a refletir o preço atual do produto

#### Scenario: Item marcado exige quantidade

- **WHEN** um item está marcado como comprado
- **THEN** sua quantidade comprada está definida, e o banco rejeita o contrário
