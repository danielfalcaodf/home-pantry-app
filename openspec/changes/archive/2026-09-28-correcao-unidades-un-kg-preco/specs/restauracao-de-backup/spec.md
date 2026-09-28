## MODIFIED Requirements

### Requirement: Verificação de versão de schema

A restauração SHALL recusar backups cuja versão de schema seja **mais nova** que a suportada pelo app, e SHALL aceitar versões anteriores, migrando o conteúdo quando necessário. Backups de versão anterior à redução de unidades SHALL ter produtos e itens de compra nas unidades removidas convertidos com as mesmas regras da migration do banco local (`g` → `kg` com quantidades ÷ 1000 e preço do produto zerado; `pacote`/`caixa` → `un` sem mudar números; `ml`/`L` → `un` arredondado para cima e preço zerado), inclusive nos movimentos de estoque.

#### Scenario: Backup de versão mais nova é recusado

- **WHEN** o backup declara uma versão de schema maior que a do app
- **THEN** a restauração é recusada com a mensagem orientando a atualizar o app antes de restaurar

#### Scenario: Backup de versão anterior é aceito

- **WHEN** o backup declara uma versão de schema anterior à do app
- **THEN** o conteúdo é convertido para o formato corrente e restaurado

#### Scenario: Backup sem versão é recusado

- **WHEN** o arquivo não declara versão de schema
- **THEN** a restauração é recusada com mensagem clara

#### Scenario: Backup v5 com produto em gramas é convertido

- **WHEN** um backup v5 contém um produto `g` com quantidade atual 500000, valor unitário 519 e
  um movimento de -200000
- **THEN** após a restauração o produto está em `kg` com quantidade atual 500, valor unitário 0,
  movimento de -200, e a reconciliação não encontra divergência

#### Scenario: Backup v5 com pacote é convertido para unidade

- **WHEN** um backup v5 contém um produto `caixa` com fator de embalagem 6
- **THEN** após a restauração o produto está em `un` com as mesmas quantidades, preço e fator
