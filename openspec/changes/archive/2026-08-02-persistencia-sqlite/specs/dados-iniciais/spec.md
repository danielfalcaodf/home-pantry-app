## ADDED Requirements

### Requirement: Casa e usuário local criados na primeira execução

Na primeira abertura, o app SHALL criar uma casa e um usuário locais, de modo que todas as consultas já filtrem por casa desde o MVP, mesmo havendo apenas uma.

#### Scenario: Casa criada uma única vez

- **WHEN** o app abre pela primeira vez
- **THEN** exatamente uma casa e um usuário são criados, com identificadores UUID v7

#### Scenario: Aberturas seguintes não duplicam

- **WHEN** o app abre novamente
- **THEN** nenhuma casa ou usuário adicional é criado

#### Scenario: Consultas filtram por casa

- **WHEN** qualquer consulta de produto, movimento ou compra é executada
- **THEN** ela inclui o filtro por casa

### Requirement: Lista base de itens comuns embarcada

O app SHALL embarcar no pacote uma lista base de aproximadamente 40 itens comuns de mercado, com nome, categoria e unidade sugeridos, disponível para o usuário adotar sem depender de rede.

#### Scenario: Lista disponível offline

- **WHEN** o usuário opta por começar pela lista básica com o aparelho sem internet
- **THEN** os itens são criados normalmente

#### Scenario: Categorias já normalizadas

- **WHEN** os itens da lista base são criados
- **THEN** suas categorias passam pela normalização de escrita do domínio

#### Scenario: Itens criados sem quantidade

- **WHEN** um item da lista base é adotado
- **THEN** ele é criado com quantidade atual zero e uma quantidade necessária sugerida maior que zero

#### Scenario: Adoção é escolha do usuário, não automática

- **WHEN** o app abre pela primeira vez
- **THEN** os itens da lista base NÃO são inseridos automaticamente; eles são oferecidos a partir do estado vazio da despensa

#### Scenario: Adoção parcial

- **WHEN** o usuário desmarca parte dos itens oferecidos
- **THEN** apenas os itens marcados são criados
