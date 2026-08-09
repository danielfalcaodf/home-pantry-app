## ADDED Requirements

### Requirement: Lista de compras finalizadas

O app SHALL listar as compras finalizadas com data, quantidade de itens e total pago, da mais recente para a mais antiga.

#### Scenario: Ordem cronológica inversa

- **WHEN** o histórico de compras é aberto
- **THEN** as compras aparecem da mais recente para a mais antiga

#### Scenario: Conteúdo de cada linha

- **WHEN** uma compra é exibida na lista
- **THEN** a linha mostra a data de finalização, quantos itens foram comprados e o total pago

#### Scenario: Compras canceladas distinguíveis

- **WHEN** o histórico inclui uma compra cancelada
- **THEN** ela é visualmente distinguida das finalizadas e não exibe total pago como gasto

#### Scenario: Valores em família monoespaçada

- **WHEN** totais e datas são exibidos
- **THEN** eles usam o papel tipográfico de dado

### Requirement: Detalhe de uma compra

O usuário SHALL poder abrir uma compra finalizada e ver seus itens com quantidade comprada e valor pago por unidade.

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

### Requirement: Histórico é somente leitura

O histórico de compras SHALL ser exclusivamente de leitura e NÃO deve permitir editar nem reabrir compras finalizadas.

#### Scenario: Sem edição

- **WHEN** o detalhe de uma compra finalizada é aberto
- **THEN** nenhuma ação de editar itens ou reabrir a compra é oferecida

#### Scenario: Correção pelo caminho de ajuste

- **WHEN** o usuário percebe que uma compra foi registrada errada
- **THEN** o caminho oferecido é corrigir a quantidade do produto por ajuste, e não alterar a compra

### Requirement: Paginação do histórico de compras

O histórico SHALL carregar as compras em blocos, usando a data como critério de continuação.

#### Scenario: Carga inicial limitada

- **WHEN** existem muitas compras finalizadas
- **THEN** apenas um bloco recente é carregado inicialmente

#### Scenario: Continuação por data

- **WHEN** a consulta de continuação é inspecionada
- **THEN** ela usa a data da última compra carregada, e não deslocamento numérico
