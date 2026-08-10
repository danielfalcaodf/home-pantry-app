## MODIFIED Requirements

### Requirement: Detalhe de uma compra

O usuário SHALL poder abrir uma compra finalizada e ver seus itens com quantidade comprada e valor pago por unidade. A distinção de itens não marcados (`comprado: false`) SHALL ser verificável diretamente no hook `use-detalhe-compra` (`src/application/resumo/use-detalhe-compra.ts`), não apenas visualmente na tela.

#### Scenario: Itens listados

- **WHEN** o detalhe de uma compra é aberto
- **THEN** seus itens aparecem com nome, quantidade comprada e valor pago por unidade

#### Scenario: Itens não comprados distinguíveis

- **WHEN** a compra tinha itens não marcados
- **THEN** eles aparecem identificados como não comprados

#### Scenario: Itens avulsos identificados

- **WHEN** a compra continha itens avulsos
- **THEN** eles aparecem pelo nome informado, identificados como avulsos

#### Scenario: Carregamento sem consultas repetidas

- **WHEN** o detalhe de uma compra com quinze itens é carregado
- **THEN** os dados dos produtos vêm em uma única consulta com junção externa

#### Scenario: Produto removido depois da compra

- **WHEN** um produto comprado foi removido posteriormente
- **THEN** o item da compra continua aparecendo no histórico, sem quebrar a tela

#### Scenario: Hook retorna o item com `comprado: false` marcado

- **WHEN** `use-detalhe-compra` monta o detalhe de uma compra que contém um item com `comprado: false`
- **THEN** o item retornado preserva essa marcação, distinguível dos itens comprados
