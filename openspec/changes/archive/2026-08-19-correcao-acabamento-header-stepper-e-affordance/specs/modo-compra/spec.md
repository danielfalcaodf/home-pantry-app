## MODIFIED Requirements

### Requirement: Ajuste de quantidade comprada e preço pago

Ao marcar um item, o usuário SHALL poder ajustar a quantidade realmente comprada e o valor pago por unidade. Sem ajuste, a quantidade planejada SHALL ser assumida como comprada.

O caminho para abrir esse ajuste NÃO SHALL depender exclusivamente de um gesto sem indicação visual (toque longo). Cada linha do Modo Compra SHALL oferecer também um caminho visível e alcançável para o mesmo ajuste — mesmo padrão já exigido no Detalhe do produto (`componentes-base`/`cadastro-de-produto`, "gesto invisível não pode ser o único acesso").

#### Scenario: Padrão assume o planejado

- **WHEN** um item é marcado sem ajuste
- **THEN** a quantidade comprada assumida é a planejada

#### Scenario: Quantidade ajustada

- **WHEN** o usuário informa uma quantidade comprada diferente da planejada
- **THEN** o valor informado é o considerado na reposição e no total

#### Scenario: Preço pago informado

- **WHEN** o usuário informa o valor pago por unidade
- **THEN** o total corrente é recalculado com esse valor

#### Scenario: Preço pago ausente

- **WHEN** o item é marcado sem informar preço pago
- **THEN** ele contribui com zero para o total corrente e não impede o fechamento

#### Scenario: Item marcado exige quantidade

- **WHEN** um item está marcado como comprado
- **THEN** sua quantidade comprada está definida, e o banco rejeita o contrário

#### Scenario: Ajuste alcançável sem toque longo

- **WHEN** o usuário quer ajustar a quantidade comprada ou o preço pago de um item no Modo Compra
- **THEN** existe um elemento visível e tocável na linha, além do toque longo, que abre o mesmo painel de ajuste
