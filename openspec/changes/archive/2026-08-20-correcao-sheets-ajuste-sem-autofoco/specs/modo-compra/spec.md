# modo-compra

## MODIFIED Requirements

### Requirement: Ajuste de quantidade comprada e preço pago

Ao marcar um item, o usuário SHALL poder ajustar a quantidade realmente comprada e o valor
pago por unidade. Sem ajuste, a quantidade planejada SHALL ser assumida como comprada, e o
preço estimado do produto (quando existir) SHALL ser assumido como preço pago. Ao abrir o
sheet de ajuste, o primeiro campo SHALL receber foco automático e o teclado SHALL ser
levantado.

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

#### Scenario: Item marcado exige quantidade

- **WHEN** um item está marcado como comprado
- **THEN** sua quantidade comprada está definida, e o banco rejeita o contrário

#### Scenario: Sheet de ajuste abre com foco automático

- **WHEN** o usuário abre o sheet de ajuste de quantidade comprada
- **THEN** o primeiro campo já está em foco e o teclado já está visível, sem toque adicional
