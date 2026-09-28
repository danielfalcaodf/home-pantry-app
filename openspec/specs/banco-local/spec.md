# banco-local

## Requirements

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

### Requirement: Migration de redução de unidades preserva os dados existentes

A migration que restringe `produto.unidade` a `un`/`kg` SHALL converter, na mesma aplicação e
sem perda de linhas, todos os dados gravados nas unidades removidas:

- `g` → `kg`: `produto.quantidade_atual`, `produto.quantidade_necessaria`,
  `movimento_estoque.quantidade_delta`, `movimento_estoque.quantidade_resultante`,
  `compra_item.quantidade_planejada` e `compra_item.quantidade_comprada` divididos por 1000;
  `produto.valor_unitario` zerado (produto passa a "sem preço"); `compra_item.unidade` = `kg`.
- `pacote`/`caixa` → `un`: quantidades, preços e fator de embalagem mantidos.
- `ml`/`L` → `un`: quantidades arredondadas para cima à unidade inteira, preço zerado.

A reescrita de `movimento_estoque` nesta migration é mudança de escala de medida, não de fato
registrado, e é a única exceção documentada à regra append-only. Depois da migration, a
quantidade materializada de cada produto convertido de `g` SHALL continuar batendo com a soma das
variações dos seus movimentos.

#### Scenario: Produto em gramas vira quilo sem preço

- **WHEN** a migration é aplicada sobre um produto `g` com quantidade atual 500000, necessária
  1000000 e valor unitário 519
- **THEN** o produto fica em `kg` com quantidade atual 500, necessária 1000 e valor unitário 0

#### Scenario: Histórico do produto em gramas acompanha a escala

- **WHEN** o produto `g` convertido tinha um movimento de baixa de -200000 com resultante 500000
- **THEN** o movimento passa a ter variação -200 e resultante 500, e a soma das variações do
  produto é igual à sua quantidade atual

#### Scenario: Pacote e caixa viram unidade sem mudar números

- **WHEN** a migration é aplicada sobre um produto `pacote` com quantidade 3000, preço 1290 e
  fator 12
- **THEN** o produto fica em `un` com quantidade 3000, preço 1290 e fator 12

#### Scenario: Unidade de volume vira unidade arredondada

- **WHEN** a migration é aplicada sobre um produto `L` com quantidade atual 1500 e valor
  unitário 899
- **THEN** o produto fica em `un` com quantidade atual 2000 e valor unitário 0 (saída de
  segurança: não há dados reais em volume no aparelho)

#### Scenario: Unidade removida é recusada pelo schema depois da migration

- **WHEN** uma escrita tenta gravar um produto com unidade `g` depois da migration
- **THEN** o `CHECK` da tabela rejeita a escrita
