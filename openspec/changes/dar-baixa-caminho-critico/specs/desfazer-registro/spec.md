## ADDED Requirements

### Requirement: Janela de desfazer de dez segundos

Após um registro de consumo, o app SHALL oferecer a ação de desfazer por dez segundos, com indicação visível do tempo restante.

#### Scenario: Ação disponível pela janela

- **WHEN** um consumo é registrado
- **THEN** a ação de desfazer permanece disponível por dez segundos

#### Scenario: Tempo restante visível

- **WHEN** a ação de desfazer está disponível
- **THEN** uma barra fina indica o tempo restante

#### Scenario: Expiração encerra a oportunidade

- **WHEN** os dez segundos se esgotam
- **THEN** a ação desaparece e o registro permanece

#### Scenario: Confirmação não bloqueia a tela

- **WHEN** a confirmação com a ação de desfazer está visível
- **THEN** o usuário pode continuar interagindo com a lista normalmente

### Requirement: Desfazer insere movimento inverso

Desfazer SHALL inserir um novo movimento de sinal oposto. O movimento original NÃO deve ser alterado nem removido.

#### Scenario: Movimento inverso gravado

- **WHEN** um registro de consumo de uma unidade é desfeito
- **THEN** um novo movimento de mais uma unidade é gravado e a quantidade volta ao valor anterior

#### Scenario: Trilha preservada

- **WHEN** um registro é desfeito
- **THEN** o movimento original continua existindo no banco

#### Scenario: Desfazer é atômico

- **WHEN** o desfazer é executado
- **THEN** a quantidade do produto e o movimento inverso são gravados na mesma transação

#### Scenario: Desfazer de um consumo que zerou o item

- **WHEN** um consumo que fixou a quantidade em zero é desfeito
- **THEN** a quantidade volta ao valor imediatamente anterior, e não a um valor calculado pela quantidade solicitada

### Requirement: Confirmação não empilha

Uma nova confirmação SHALL substituir a anterior. Confirmações NÃO devem se acumular na tela.

#### Scenario: Registros sucessivos

- **WHEN** o usuário registra consumo em três itens seguidos
- **THEN** apenas uma confirmação está visível, referente ao registro mais recente

#### Scenario: Desfazer sempre aponta para o registro exibido

- **WHEN** uma confirmação substitui outra e o usuário aciona desfazer
- **THEN** o registro desfeito é o descrito na confirmação visível, e não um anterior

### Requirement: Confirmação descreve o que foi registrado

A confirmação SHALL informar o item e a quantidade registrada, em linguagem do usuário.

#### Scenario: Texto descritivo

- **WHEN** o consumo de dois pacotes de um item é registrado
- **THEN** a confirmação nomeia o item e a quantidade registrada

#### Scenario: Vocabulário do usuário

- **WHEN** a confirmação é exibida
- **THEN** ela usa o mesmo verbo da ação acionada, sem termos de sistema
