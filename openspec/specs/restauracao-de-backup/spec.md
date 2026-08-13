# restauracao-de-backup

## Requirements

### Requirement: Restauração transacional

A restauração SHALL aplicar todo o conteúdo do backup em uma **única transação**. Uma falha no meio NÃO deve deixar o banco em estado parcial.

#### Scenario: Restauração completa

- **WHEN** um backup válido é restaurado com sucesso
- **THEN** todos os seus registros estão no banco

#### Scenario: Falha não deixa estado parcial

- **WHEN** a restauração falha no meio do processamento
- **THEN** o banco permanece exatamente como estava antes, e a mensagem oferece tentar novamente

#### Scenario: Arquivo malformado é recusado antes de escrever

- **WHEN** o arquivo selecionado não é um backup válido
- **THEN** a restauração é recusada com mensagem clara, sem nenhuma escrita no banco

### Requirement: Combinação por identificador

A restauração SHALL combinar registros por identificador, atualizando os existentes e inserindo os ausentes. Identificadores são UUID, o que torna a operação segura.

#### Scenario: Registro ausente é inserido

- **WHEN** o backup contém um produto que não existe no banco
- **THEN** ele é inserido

#### Scenario: Registro existente é atualizado

- **WHEN** o backup contém um produto cujo identificador já existe
- **THEN** o registro existente é atualizado com o conteúdo do backup

#### Scenario: Restauração repetida é idempotente

- **WHEN** o mesmo backup é restaurado duas vezes seguidas
- **THEN** o resultado final é idêntico ao da primeira restauração, sem registros duplicados

#### Scenario: Movimentos não são duplicados

- **WHEN** um backup contendo movimentos já presentes é restaurado
- **THEN** nenhum movimento duplicado é criado

### Requirement: Verificação de versão de schema

A restauração SHALL recusar backups cuja versão de schema seja **mais nova** que a suportada pelo app, e SHALL aceitar versões anteriores, migrando o conteúdo quando necessário.

#### Scenario: Backup de versão mais nova é recusado

- **WHEN** o backup declara uma versão de schema maior que a do app
- **THEN** a restauração é recusada com a mensagem orientando a atualizar o app antes de restaurar

#### Scenario: Backup de versão anterior é aceito

- **WHEN** o backup declara uma versão de schema anterior à do app
- **THEN** o conteúdo é convertido para o formato corrente e restaurado

#### Scenario: Backup sem versão é recusado

- **WHEN** o arquivo não declara versão de schema
- **THEN** a restauração é recusada com mensagem clara

### Requirement: Reconciliação após restaurar

Ao final de toda restauração bem-sucedida, o app SHALL verificar se a quantidade materializada de cada produto corresponde à soma das variações de seus movimentos, e SHALL informar qualquer divergência oferecendo um caminho direto para corrigi-la.

#### Scenario: Banco coerente após restaurar

- **WHEN** a reconciliação roda após uma restauração de backup íntegro
- **THEN** nenhuma divergência é encontrada

#### Scenario: Divergência é informada com ação para corrigir

- **WHEN** a reconciliação encontra produtos cuja quantidade não corresponde à soma dos movimentos
- **THEN** o app informa quantos produtos divergem e oferece uma ação que leva à correção pela soma dos movimentos

#### Scenario: Ação do aviso leva ao Diagnóstico

- **WHEN** o usuário toca na ação oferecida junto ao aviso de divergência
- **THEN** o app navega para a tela de Diagnóstico, onde a correção pode ser aplicada

#### Scenario: Correção registra a mudança

- **WHEN** o usuário opta por corrigir uma divergência
- **THEN** um movimento de ajuste é gravado, e a quantidade não é alterada em silêncio

### Requirement: Restauração pede confirmação explícita

A restauração SHALL exigir confirmação explícita, informando que ela sobrescreve dados existentes.

#### Scenario: Confirmação obrigatória

- **WHEN** o usuário seleciona um arquivo de backup
- **THEN** uma confirmação explícita é exigida antes de qualquer escrita

#### Scenario: Resumo antes de aplicar

- **WHEN** a confirmação é apresentada
- **THEN** ela informa a data do backup e quantos registros serão restaurados

#### Scenario: Cancelamento não escreve

- **WHEN** o usuário cancela na confirmação
- **THEN** nenhuma escrita ocorre

### Requirement: Restauração funciona offline

A restauração SHALL funcionar integralmente sem conexão de rede.

#### Scenario: Restaurar sem rede

- **WHEN** o aparelho está sem conexão e um arquivo local é restaurado
- **THEN** a operação conclui normalmente
