## ADDED Requirements

### Requirement: Configuração local persistida

O banco SHALL conter uma tabela de configuração da casa, chave-valor, para preferências que precisam sobreviver ao fechamento do app. A preferência de tema é a primeira delas.

#### Scenario: Migration nova, não edição da inicial

- **WHEN** a tabela de configuração é adicionada
- **THEN** ela chega em uma migration nova e forward-only, e a migration inicial permanece intacta

#### Scenario: Leitura de preferência ausente

- **WHEN** uma preferência ainda não foi gravada
- **THEN** a leitura retorna o valor padrão declarado, sem erro

#### Scenario: Gravação sobrescreve

- **WHEN** uma preferência já existente é gravada novamente
- **THEN** o valor anterior é substituído e nenhuma linha duplicada é criada

#### Scenario: Configuração pertence à casa

- **WHEN** uma preferência é gravada
- **THEN** ela é associada à casa, mantendo o padrão de filtro por casa de todo o schema
