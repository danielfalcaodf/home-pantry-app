## MODIFIED Requirements

### Requirement: Preferência de tema persistida

O usuário SHALL poder escolher entre automático pelo sistema, claro e escuro, com automático como padrão. A escolha SHALL ser persistida no banco local, e NÃO em estado volátil. A persistência SHALL ser feita pelo hook de aplicação (`usePreferenciaDeTemaPersistida`) através de um repositório injetável, permitindo verificar diretamente — com um repositório fake — que gravar a escolha e montar o hook novamente reflete o valor salvo, sem depender apenas da função pura de resolução de tema.

#### Scenario: Padrão é automático

- **WHEN** o app abre pela primeira vez
- **THEN** o tema segue a preferência de aparência do sistema

#### Scenario: Escolha sobrevive ao fechamento

- **WHEN** o usuário escolhe o tema claro e fecha e reabre o app
- **THEN** o app abre no tema claro, mesmo com o sistema em modo escuro

#### Scenario: Automático acompanha mudança do sistema

- **WHEN** a preferência é automática e o sistema alterna de claro para escuro
- **THEN** o app alterna junto, sem reinício
