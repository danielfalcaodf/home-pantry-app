## ADDED Requirements

### Requirement: Histórico de movimentos do produto

O app SHALL exibir, para cada produto, a lista de seus movimentos com tipo, quantidade, data e motivo quando houver, do mais recente para o mais antigo.

#### Scenario: Ordem cronológica inversa

- **WHEN** o histórico de um produto é aberto
- **THEN** os movimentos aparecem do mais recente para o mais antigo

#### Scenario: Conteúdo de cada linha

- **WHEN** um movimento é exibido
- **THEN** a linha mostra o que aconteceu, a quantidade, a data e o motivo quando houver

#### Scenario: Tipos distinguíveis

- **WHEN** o histórico contém consumos, reposições e ajustes
- **THEN** os três são visualmente distinguíveis

#### Scenario: Reposição vinculada a compra

- **WHEN** um movimento de reposição veio de uma compra
- **THEN** o histórico indica que ele veio de uma compra

#### Scenario: Números em família monoespaçada

- **WHEN** quantidades e datas são exibidas no histórico
- **THEN** elas usam o papel tipográfico de dado

### Requirement: Vocabulário de usuário no histórico

O histórico SHALL descrever os movimentos na linguagem da interface, mantendo o mesmo verbo usado no momento da ação.

#### Scenario: Consumo descrito com o verbo da ação

- **WHEN** um consumo registrado pelo botão da lista aparece no histórico
- **THEN** ele é descrito com o mesmo verbo usado no botão e na confirmação

#### Scenario: Ausência de jargão

- **WHEN** qualquer linha do histórico é exibida
- **THEN** ela NÃO contém "dar baixa", "movimento de estoque" nem "reposição"

### Requirement: Histórico é somente leitura

O histórico SHALL ser exclusivamente de leitura e NÃO deve oferecer edição nem remoção de movimentos.

#### Scenario: Sem edição

- **WHEN** o histórico é exibido
- **THEN** nenhuma ação de editar ou remover movimento é oferecida

#### Scenario: Correção pelo caminho de ajuste

- **WHEN** o usuário percebe que um registro está errado
- **THEN** o caminho oferecido é registrar um ajuste, e não alterar o registro anterior

### Requirement: Histórico paginado por data

O histórico SHALL carregar os movimentos em blocos, sem carregar todo o histórico de uma vez, e SHALL usar a data como critério de continuação.

#### Scenario: Carga inicial limitada

- **WHEN** o histórico de um produto com milhares de movimentos é aberto
- **THEN** apenas um bloco recente é carregado inicialmente

#### Scenario: Continuação por rolagem

- **WHEN** o usuário rola até o fim do bloco carregado
- **THEN** o bloco seguinte é carregado

#### Scenario: Continuação por data, não por deslocamento

- **WHEN** a consulta de continuação é inspecionada
- **THEN** ela usa a data do último item carregado como critério, e não deslocamento numérico
