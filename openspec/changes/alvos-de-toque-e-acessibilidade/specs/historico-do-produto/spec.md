## MODIFIED Requirements

### Requirement: Histórico de movimentos do produto

O app SHALL exibir, para cada produto, a lista de seus movimentos com tipo, quantidade, data e motivo quando houver, do mais recente para o mais antigo. Cada linha SHALL ser um único contêiner acessível (`accessible`), com `accessibilityLabel` combinando ação, quantidade, data e motivo quando houver — nunca fragmentos soltos na árvore de acessibilidade.

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

#### Scenario: Linha anunciada como unidade única

- **WHEN** o leitor de tela foca uma linha do histórico
- **THEN** ela é anunciada em uma única parada de foco, com ação, quantidade, data e motivo (quando houver) combinados no mesmo rótulo — não em três ou mais paradas de foco separadas
