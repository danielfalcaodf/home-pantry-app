## ADDED Requirements

### Requirement: Tela de configurações acessível

O app SHALL oferecer uma tela de configurações contendo a escolha de tema, as ações de backup e restauração, a exportação de dados e o acesso ao diagnóstico.

#### Scenario: Acesso a partir do app

- **WHEN** o usuário procura as configurações
- **THEN** ela é alcançável a partir de uma tela principal, sem navegação profunda

#### Scenario: Escolha de tema presente

- **WHEN** a tela de configurações é aberta
- **THEN** as três opções de tema estão disponíveis e a escolha é persistida

#### Scenario: Ações de dados agrupadas

- **WHEN** a tela de configurações é aberta
- **THEN** exportar backup, restaurar backup e exportar dados aparecem agrupados

### Requirement: Ações destrutivas sinalizadas

Ações que sobrescrevem dados SHALL ser visualmente distinguidas das demais e SHALL exigir confirmação.

#### Scenario: Restauração sinalizada

- **WHEN** a ação de restaurar é exibida
- **THEN** ela é distinguida das ações não destrutivas e descreve seu efeito

#### Scenario: Exportação não pede confirmação

- **WHEN** a ação de exportar é acionada
- **THEN** ela executa diretamente, por não alterar dados

### Requirement: Recomendação de backup periódico

A tela SHALL informar quando o último backup foi feito, para que o usuário perceba se está desprotegido.

#### Scenario: Data do último backup

- **WHEN** um backup já foi gerado
- **THEN** a tela informa quando ele foi feito

#### Scenario: Nunca feito

- **WHEN** nenhum backup foi gerado
- **THEN** a tela informa que ainda não há backup e convida a fazer um
