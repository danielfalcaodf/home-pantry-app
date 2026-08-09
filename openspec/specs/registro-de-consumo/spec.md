# registro-de-consumo

## Purpose

Definir o caminho crítico do app — registrar consumo de um item da despensa em até três toques e dez segundos — incluindo o gesto padrão de um toque, a rota de quantidade específica por toque longo, os casos de borda de saldo e a garantia de funcionamento offline.

## Requirements

### Requirement: Registro de consumo em um toque

Um único toque no botão de consumo da linha SHALL subtrair uma unidade e persistir imediatamente. NÃO deve haver tela de confirmação, navegação adicional nem indicador de carregamento nesse caminho.

#### Scenario: Toque único registra e salva

- **WHEN** o usuário toca uma vez no botão de consumo de um item
- **THEN** a quantidade é reduzida em uma unidade e a alteração está persistida, sem nenhuma tela intermediária

#### Scenario: Sem confirmação

- **WHEN** o consumo é registrado
- **THEN** nenhum diálogo de confirmação é exibido

#### Scenario: Sem indicador de carregamento

- **WHEN** o consumo é registrado
- **THEN** nenhum indicador de progresso aparece no botão nem na linha

#### Scenario: Toques repetidos acumulam

- **WHEN** o usuário toca três vezes seguidas no botão do mesmo item
- **THEN** a quantidade é reduzida em três unidades e três registros são gravados

#### Scenario: Meta do caminho crítico

- **WHEN** o usuário abre o app e registra o consumo de um item
- **THEN** a tarefa é concluída em no máximo três toques e em no máximo dez segundos

### Requirement: Consumo é atômico com a trilha

O registro de consumo SHALL gravar a nova quantidade do produto e o movimento correspondente em uma única transação.

#### Scenario: Gravação conjunta

- **WHEN** um consumo é registrado com sucesso
- **THEN** a quantidade atualizada e o movimento correspondente estão ambos gravados

#### Scenario: Falha não altera nada

- **WHEN** a gravação falha
- **THEN** a quantidade permanece inalterada, nenhum movimento é gravado, e a mensagem informa o que houve com a ação de tentar novamente

#### Scenario: Registro contém autor e resultado

- **WHEN** um consumo é gravado
- **THEN** o movimento registra o usuário, a data e hora, a variação e a quantidade resultante

### Requirement: Quantidade nunca fica negativa

Um consumo maior que o saldo SHALL resultar em quantidade zero, e o app SHALL informar que o item acabou.

#### Scenario: Consumo maior que o saldo

- **WHEN** o item tem meia unidade e o usuário registra o consumo de uma unidade
- **THEN** a quantidade final é zero e a operação conclui com sucesso

#### Scenario: Aviso ao zerar

- **WHEN** a quantidade chega a zero por um registro de consumo
- **THEN** o app informa que o item acabou

#### Scenario: Item já zerado não registra

- **WHEN** o usuário aciona o botão de consumo de um item já zerado
- **THEN** nenhum movimento é gravado e o botão está visivelmente sem função

### Requirement: Quantidade específica por toque longo

Um toque longo no botão de consumo SHALL abrir um painel inferior para informar uma quantidade específica, com as ações de registrar consumo e de registrar reposição.

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

### Requirement: Caminho alternativo visível ao toque longo

Toda ação disponível por toque longo SHALL ter um caminho equivalente visível na tela de detalhe do produto.

#### Scenario: Ações no detalhe

- **WHEN** a tela de detalhe de um produto é aberta
- **THEN** as ações de registrar consumo e registrar reposição estão visíveis abaixo da quantidade

#### Scenario: Equivalência de efeito

- **WHEN** o consumo é registrado pela tela de detalhe
- **THEN** o efeito é idêntico ao do registro feito pela lista

### Requirement: Vocabulário consistente do começo ao fim

A ação SHALL manter o mesmo nome em todos os pontos: o botão, a confirmação e o histórico. Termos de sistema NÃO devem aparecer na interface.

#### Scenario: Nomes coerentes

- **WHEN** o usuário registra um consumo
- **THEN** o botão, a mensagem de confirmação e o histórico usam o mesmo vocabulário de usuário

#### Scenario: Ausência de jargão

- **WHEN** qualquer texto deste fluxo é exibido
- **THEN** ele NÃO contém "dar baixa", "movimento de estoque" nem "reposição"

### Requirement: Funciona offline

O registro de consumo SHALL funcionar integralmente sem conexão de rede.

#### Scenario: Registro sem rede

- **WHEN** o aparelho está sem conexão e o usuário registra um consumo
- **THEN** a operação conclui normalmente, sem aviso de indisponibilidade
