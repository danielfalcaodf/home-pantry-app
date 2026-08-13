## ADDED Requirements

### Requirement: Conexão única com PRAGMAs obrigatórios verificados por teste

O app SHALL abrir **uma única** conexão SQLite para todo o processo, com o PRAGMA de modo de journal em WAL ativo e a escuta de mudanças habilitada logo na abertura. Essas três garantias — modo WAL, singleton e escuta habilitada — SHALL ser verificadas por teste automatizado, e não apenas implementadas.

#### Scenario: Modo WAL ativo

- **WHEN** o modo de journal é consultado (`PRAGMA journal_mode`) após a abertura da conexão
- **THEN** o teste automatizado confirma que o valor retornado é `wal`

#### Scenario: Conexão é singleton

- **WHEN** um teste importa o cliente de banco por dois caminhos de módulo diferentes
- **THEN** ambos recebem a mesma instância, e o teste falha se uma segunda conexão for aberta

#### Scenario: Escuta de mudanças habilitada

- **WHEN** um teste mocka `addDatabaseChangeListener` e chama `assinar()` do observador
- **THEN** o teste confirma que o listener nativo foi registrado, e que a função de cancelamento retornada remove a inscrição

### Requirement: Backup automático antes de migration pendente com retenção de duas cópias

Antes de aplicar qualquer migration pendente, o app SHALL gerar uma cópia do arquivo de banco e manter apenas as **duas cópias mais recentes**. Quando não há migration pendente, nenhuma cópia SHALL ser gerada. Esse mecanismo SHALL ser coberto por teste automatizado.

#### Scenario: Cópia gerada antes de migration pendente

- **WHEN** existe migration pendente a aplicar e o mecanismo de backup roda
- **THEN** uma nova cópia do arquivo de banco é criada antes da aplicação

#### Scenario: Retenção das duas mais recentes

- **WHEN** já existem duas ou mais cópias de backup e uma nova é gerada
- **THEN** apenas as duas cópias mais recentes permanecem, e as mais antigas são removidas

#### Scenario: Sem migration pendente, sem cópia

- **WHEN** o banco já está na versão mais recente e não há migration pendente
- **THEN** o mecanismo de backup não gera nenhuma cópia nova

### Requirement: Aplicação de migrations a partir de qualquer versão publicada

As migrations SHALL concluir sem erro e produzir o mesmo schema final independentemente de partirem de um banco vazio ou de um banco em qualquer versão intermediária já publicada. Esse comportamento SHALL ser coberto por teste automatizado que exercite explicitamente a versão intermediária, não apenas a aplicação desde vazio.

#### Scenario: Aplicação a partir de versão intermediária

- **WHEN**, para cada migration N maior ou igual a 1, as migrations `0` até `N-1` são aplicadas, dados representativos são inseridos, e o restante das migrations é aplicado em seguida
- **THEN** o schema final resultante é idêntico ao schema produzido pela aplicação de todas as migrations desde um banco vazio, e os dados inseridos permanecem íntegros

### Requirement: Preparação do banco na abertura do app coberta por teste de sucesso e falha

O fluxo que aplica migrations pendentes antes de renderizar a interface normal, e que exibe a tela de erro quando a aplicação falha, SHALL ser coberto por teste automatizado que exercite os dois caminhos — sucesso e falha — sem depender de emulador.

#### Scenario: Migration aplicada com sucesso libera a rota normal

- **WHEN** um teste mocka o resultado de aplicação de migrations como bem-sucedido
- **THEN** o teste confirma que a rota normal do app é renderizada, e não a tela de erro

#### Scenario: Falha de migration exibe a tela de erro

- **WHEN** um teste mocka o resultado de aplicação de migrations como falho
- **THEN** o teste confirma que a tela de erro é renderizada, e que a interface normal não é alcançada
