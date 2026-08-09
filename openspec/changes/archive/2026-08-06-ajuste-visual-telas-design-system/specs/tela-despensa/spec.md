## MODIFIED Requirements

### Requirement: Filtro por estado com contagem

A despensa SHALL exibir chips de filtro por estado — `Tudo`, `Acabou` (itens críticos) e `Faltando` (itens críticos e itens abaixo do mínimo, somados) —, cada um com a contagem de itens que ele cobre, e SHALL filtrar a lista ao chip ativo. Não há chip dedicado a itens completos (`Cheio`); esses itens continuam visíveis no chip `Tudo`.

#### Scenario: Contagens refletem a despensa

- **WHEN** a despensa tem 3 itens zerados e 12 abaixo do mínimo
- **THEN** o chip `Acabou` exibe 3 e o chip `Faltando` exibe 15 (3 críticos + 12 em falta)

#### Scenario: Filtro "Acabou" aplicado

- **WHEN** o chip `Acabou` é ativado
- **THEN** apenas os itens no estado crítico permanecem na lista

#### Scenario: Filtro "Faltando" aplicado

- **WHEN** o chip `Faltando` é ativado
- **THEN** os itens em estado crítico e os itens em falta permanecem na lista, e os itens completos (`Cheio`) somem

#### Scenario: Contagem atualiza após mudança de quantidade

- **WHEN** a quantidade de um item muda e ele troca de estado
- **THEN** as contagens dos chips `Acabou` e `Faltando` são atualizadas sem recarregar a tela

#### Scenario: Chip sem itens

- **WHEN** nenhum item está no estado crítico nem em falta
- **THEN** os chips `Acabou` e `Faltando` exibem contagem zero e permanecem acionáveis
