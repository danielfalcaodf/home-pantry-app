## ADDED Requirements

### Requirement: Backup em JSON versionado

O app SHALL exportar todos os dados da casa como JSON contendo a versão de schema e a data de exportação. Cópia binária do arquivo de banco NÃO deve ser usada como formato de backup.

#### Scenario: Estrutura do arquivo

- **WHEN** um backup é gerado
- **THEN** o JSON contém a versão de schema, a data de exportação, a casa, os usuários, os produtos, os movimentos, as compras e os itens de compra

#### Scenario: Versão de schema presente

- **WHEN** um backup é gerado
- **THEN** ele declara a versão de schema do banco no momento da exportação

#### Scenario: Formato textual, não binário

- **WHEN** o arquivo de backup é inspecionado
- **THEN** ele é JSON legível, e não uma cópia do arquivo de banco

#### Scenario: Valores preservados em unidades internas

- **WHEN** quantidades e valores são exportados
- **THEN** eles são gravados como inteiros em milésimos e centavos, sem conversão para exibição

### Requirement: Backup completo

O backup SHALL incluir todos os registros da casa, inclusive os removidos logicamente e todo o histórico de movimentos.

#### Scenario: Produtos removidos incluídos

- **WHEN** a casa tem produtos removidos logicamente
- **THEN** eles constam no backup com sua marcação de remoção

#### Scenario: Histórico completo

- **WHEN** o backup é gerado
- **THEN** todos os movimentos de estoque estão presentes, sem truncamento por data

#### Scenario: Compras finalizadas e abertas

- **WHEN** existe uma compra aberta e várias finalizadas
- **THEN** todas constam no backup com seus itens

### Requirement: Compartilhamento do arquivo

O usuário SHALL poder salvar ou enviar o arquivo de backup pela folha de compartilhamento do sistema.

#### Scenario: Compartilhamento acionado

- **WHEN** o usuário aciona a exportação
- **THEN** a folha de compartilhamento do sistema abre com o arquivo pronto

#### Scenario: Nome de arquivo identificável

- **WHEN** o arquivo é gerado
- **THEN** seu nome inclui a data da exportação, permitindo distinguir backups

#### Scenario: Exportação funciona offline

- **WHEN** o aparelho está sem conexão
- **THEN** a geração do arquivo conclui normalmente

### Requirement: Exportação de produtos em formato tabular

O app SHALL permitir exportar os produtos em formato tabular separado por vírgulas, para uso fora do app.

#### Scenario: Arquivo tabular gerado

- **WHEN** o usuário aciona a exportação tabular
- **THEN** um arquivo separado por vírgulas com os produtos é gerado e compartilhado

#### Scenario: Valores formatados para leitura humana

- **WHEN** o arquivo tabular é gerado
- **THEN** quantidades e valores estão convertidos para leitura, e não em unidades internas

#### Scenario: Distinção do backup

- **WHEN** o arquivo tabular é gerado
- **THEN** ele é oferecido como exportação de dados, e não como backup restaurável
