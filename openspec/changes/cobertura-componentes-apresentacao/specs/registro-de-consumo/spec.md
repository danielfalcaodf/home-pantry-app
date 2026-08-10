## MODIFIED Requirements

### Requirement: Quantidade específica por toque longo

Um toque longo no botão de consumo SHALL abrir um painel inferior para informar uma quantidade específica, com as ações de registrar consumo e de registrar reposição. Os dois caminhos (`onUsei` e `onRepus`) SHALL ter cobertura de teste simétrica: cada um confirmado tanto no caminho positivo (chamado com o valor digitado, painel fecha) quanto no negativo (fechar sem confirmar não chama nenhum dos dois).

#### Scenario: Painel abre com toque longo

- **WHEN** o usuário mantém o botão de consumo pressionado
- **THEN** o painel de quantidade é aberto para aquele item

#### Scenario: Campo único, sem formulário

- **WHEN** o painel de quantidade está aberto
- **THEN** existe um único campo numérico com a unidade do item fixa ao lado, e duas ações

#### Scenario: Registrar consumo específico

- **WHEN** o usuário informa duas unidades e escolhe registrar consumo
- **THEN** a quantidade é reduzida em duas unidades e o painel fecha

#### Scenario: Registrar reposição específica

- **WHEN** o usuário informa duas unidades e escolhe registrar reposição
- **THEN** a quantidade é aumentada em duas unidades e o painel fecha

#### Scenario: Quantidade decimal em unidade divisível

- **WHEN** o item está em unidade divisível e o usuário informa meia unidade
- **THEN** o valor é aceito e registrado

#### Scenario: Fechamento sem registrar

- **WHEN** o usuário fecha o painel sem confirmar
- **THEN** nenhuma alteração é feita

#### Scenario: Cobertura simétrica dos dois caminhos de confirmação

- **WHEN** o usuário informa uma quantidade e escolhe registrar reposição
- **THEN** `onRepus` é chamado com o valor digitado e o painel fecha — o mesmo padrão de verificação já aplicado ao caminho de registrar consumo
