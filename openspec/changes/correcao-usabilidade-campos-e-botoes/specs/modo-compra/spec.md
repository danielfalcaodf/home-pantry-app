## MODIFIED Requirements

### Requirement: Ajuste de quantidade comprada e preço pago

Ao marcar um item, o usuário SHALL poder ajustar a quantidade realmente comprada e o valor pago por unidade. Sem ajuste, a quantidade planejada SHALL ser assumida como comprada. O painel de ajuste (`SheetAjusteCompra`) SHALL validar quantidade e preço digitados antes de salvar, rejeitando com erro em texto entradas que não podem ser interpretadas como número, em vez de substituir em silêncio pelo valor planejado/nulo, e SHALL manter o campo em foco e o botão de ação visíveis quando o teclado do sistema está aberto.

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

#### Scenario: Quantidade inválida em `SheetAjusteCompra` é rejeitada, não substituída

- **WHEN** o usuário digita uma quantidade que não pode ser interpretada como número maior que zero em `SheetAjusteCompra` e toca salvar
- **THEN** o campo exibe erro em texto e o valor planejado não é silenciosamente assumido no lugar do que foi digitado

#### Scenario: Preço inválido em `SheetAjusteCompra` é rejeitado, não substituído

- **WHEN** o usuário digita um preço que não pode ser interpretado como número em `SheetAjusteCompra` e toca salvar
- **THEN** o campo exibe erro em texto, em vez de gravar preço nulo em silêncio

#### Scenario: Campo de ajuste da compra não fica coberto pelo teclado

- **WHEN** o teclado do sistema abre com `SheetAjusteCompra` visível
- **THEN** os campos de quantidade e preço pago, e o botão "Salvar", continuam visíveis e alcançáveis
