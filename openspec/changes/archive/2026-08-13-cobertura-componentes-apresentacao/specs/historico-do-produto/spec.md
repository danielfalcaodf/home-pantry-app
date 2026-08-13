## MODIFIED Requirements

### Requirement: Histórico de movimentos do produto

O app SHALL exibir, para cada produto, a lista de seus movimentos com tipo, quantidade, data e motivo quando houver, do mais recente para o mais antigo. As três cores usadas para distinguir consumo, reposição e ajuste (`corDoMovimento`, em `src/presentation/theme/cor-do-estado.ts`) SHALL ser mutuamente distintas entre si.

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

#### Scenario: Cores dos três tipos não colidem

- **WHEN** `corDoMovimento` é chamada para consumo, reposição e ajuste
- **THEN** as três cores retornadas são diferentes entre si, nenhum par coincide
