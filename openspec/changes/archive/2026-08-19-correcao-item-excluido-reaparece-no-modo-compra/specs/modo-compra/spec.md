## MODIFIED Requirements

### Requirement: Iniciar a compra a partir da lista

A lista de compras SHALL oferecer a ação de iniciar a compra, convertendo seus itens correntes em itens planejados da compra aberta.

Um item que a pessoa removeu da lista antes de iniciar a compra ("Fora da lista por agora") SHALL permanecer fora do Modo Compra: a tela de compra NÃO SHALL exibir nenhuma linha marcada como excluída da compra aberta, mesmo que a linha exista na tabela por reaproveitamento de `compra_item`.

#### Scenario: Conversão dos itens

- **WHEN** o usuário inicia a compra a partir de uma lista com quinze itens
- **THEN** a compra aberta passa a conter quinze itens planejados

#### Scenario: Quantidade planejada já arredondada

- **WHEN** um item em unidade indivisível é convertido
- **THEN** sua quantidade planejada é a já arredondada pela regra de domínio, sem novo arredondamento

#### Scenario: Avulsos incluídos

- **WHEN** a lista contém itens avulsos
- **THEN** eles fazem parte da compra como itens sem produto associado

#### Scenario: Retomar compra em andamento

- **WHEN** existe uma compra aberta com itens já marcados e o usuário volta ao modo compra
- **THEN** as marcações anteriores estão preservadas

#### Scenario: Item removido da lista não aparece no Modo Compra

- **WHEN** um item faltante é removido da lista ("Fora da lista por agora") e em seguida a compra é iniciada
- **THEN** esse item não aparece como linha marcável na tela de Modo Compra

#### Scenario: Item reativado volta a aparecer

- **WHEN** um item removido é reativado ("Voltar pra lista") antes de a compra ser iniciada
- **THEN** ele aparece normalmente no Modo Compra, como qualquer outro item da lista
