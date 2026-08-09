## ADDED Requirements

### Requirement: Conexão única com PRAGMAs obrigatórios

O app SHALL abrir **uma única** conexão SQLite para todo o processo, e SHALL executar na abertura, antes de qualquer consulta, os PRAGMAs de modo de journal WAL, chaves estrangeiras ligadas, sincronismo normal e tempo limite de ocupação.

#### Scenario: Chaves estrangeiras ligadas

- **WHEN** a conexão é aberta e o valor do PRAGMA de chaves estrangeiras é consultado
- **THEN** ele retorna ligado

#### Scenario: Órfão é rejeitado

- **WHEN** uma inserção referencia um identificador de produto que não existe
- **THEN** a escrita falha com erro de restrição de chave estrangeira

#### Scenario: Modo WAL ativo

- **WHEN** o modo de journal é consultado após a abertura
- **THEN** ele é WAL

#### Scenario: Conexão é singleton

- **WHEN** dois módulos diferentes importam o cliente de banco
- **THEN** ambos recebem a mesma instância, e o banco não é reaberto

#### Scenario: Escuta de mudanças habilitada

- **WHEN** a conexão é aberta
- **THEN** a escuta de alterações está habilitada, permitindo que consultas reativas re-emitam após uma escrita

### Requirement: Schema conforme o modelo de dados

O banco SHALL conter as tabelas `casa`, `usuario`, `produto`, `movimento_estoque`, `compra` e `compra_item` com as colunas, restrições e valores padrão definidos no documento de banco de dados.

#### Scenario: Quantidade e dinheiro são inteiros

- **WHEN** o schema das colunas de quantidade e de valor é inspecionado
- **THEN** todas são do tipo inteiro, e nenhuma é de ponto flutuante

#### Scenario: Chave primária textual UUID

- **WHEN** uma linha é inserida em qualquer tabela
- **THEN** sua chave primária é um texto no formato UUID v7

#### Scenario: Restrição de quantidade não negativa

- **WHEN** uma tentativa de gravar quantidade atual negativa em produto é feita
- **THEN** a escrita falha por violação de restrição

#### Scenario: Restrição de coerência de sinal do movimento

- **WHEN** uma tentativa de inserir um movimento do tipo baixa com variação positiva é feita
- **THEN** a escrita falha por violação de restrição

#### Scenario: Restrição de variação não nula

- **WHEN** uma tentativa de inserir um movimento com variação zero é feita
- **THEN** a escrita falha por violação de restrição

#### Scenario: Item de compra é de produto ou avulso

- **WHEN** uma tentativa de inserir um item de compra sem produto associado e sem nome avulso é feita
- **THEN** a escrita falha por violação de restrição

### Requirement: Índices do MVP

O banco SHALL conter exatamente os índices definidos para o MVP: unicidade de nome de produto por casa ignorando insensibilidade de caixa e linhas removidas, índice parcial de produtos em falta, índice de categoria para autocompletar, dois índices de histórico de movimento, unicidade da compra aberta por casa, e índice de itens por compra. Índices de sincronização NÃO devem ser criados nesta fase.

#### Scenario: Nome duplicado é rejeitado pelo banco

- **WHEN** um segundo produto com o mesmo nome, na mesma casa, ignorando caixa, é inserido
- **THEN** a escrita falha por violação de unicidade

#### Scenario: Nome reutilizável após remoção lógica

- **WHEN** um produto é removido logicamente e outro com o mesmo nome é inserido na mesma casa
- **THEN** a escrita é aceita

#### Scenario: Índice parcial de faltantes é utilizado

- **WHEN** o plano de execução da consulta da lista de compras é inspecionado
- **THEN** ele indica busca pelo índice de produtos em falta, e não varredura completa da tabela

#### Scenario: No máximo uma compra aberta por casa

- **WHEN** uma segunda compra com situação aberta é criada para a mesma casa
- **THEN** a escrita falha por violação de unicidade

#### Scenario: Índices de sincronização ausentes

- **WHEN** a lista de índices do banco é inspecionada
- **THEN** nenhum índice sobre a coluna de situação de sincronização existe

### Requirement: Migrations forward-only aplicadas na abertura

As migrations SHALL ser versionadas em arquivo, aplicadas automaticamente na abertura do app, e SHALL ser forward-only — não existe reversão executável no aparelho. Uma migration já publicada NÃO deve ser editada.

#### Scenario: Migration aplicada com sucesso

- **WHEN** o app abre com o banco em uma versão anterior
- **THEN** as migrations pendentes são aplicadas antes de qualquer tela de dados renderizar

#### Scenario: Falha de migration é visível

- **WHEN** uma migration falha ao ser aplicada
- **THEN** o app exibe uma tela de erro explícita e NÃO prossegue para a interface normal

#### Scenario: Aplicação desde o schema vazio

- **WHEN** todas as migrations são aplicadas em sequência sobre um banco vazio
- **THEN** o schema resultante é idêntico ao schema declarado

#### Scenario: Aplicação a partir de versão intermediária

- **WHEN** as migrations são aplicadas sobre um banco em qualquer versão anterior publicada
- **THEN** elas concluem sem erro e produzem o mesmo schema final

#### Scenario: Backup antes de migrar

- **WHEN** existe migration pendente a aplicar
- **THEN** uma cópia do arquivo de banco é criada antes da aplicação, e as duas cópias mais recentes são mantidas
