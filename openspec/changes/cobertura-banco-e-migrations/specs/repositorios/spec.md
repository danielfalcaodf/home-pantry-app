## MODIFIED Requirements

### Requirement: Consulta da despensa com estado e ordenação

O repositório de produto SHALL fornecer a lista de produtos ativos e não removidos da casa, com colunas explícitas, ordenados por estado — crítico, depois em falta, depois ok — e alfabeticamente dentro de cada grupo, ignorando caixa.

#### Scenario: Ordenação por estado

- **WHEN** a despensa contém um produto ok, um zerado e um em falta
- **THEN** a ordem retornada é o zerado, depois o em falta, depois o ok

#### Scenario: Ordem alfabética dentro do grupo

- **WHEN** dois produtos estão no mesmo estado
- **THEN** eles são retornados em ordem alfabética, ignorando diferença de caixa

#### Scenario: Removidos e inativos são excluídos

- **WHEN** existem produtos removidos logicamente ou inativos
- **THEN** eles NÃO aparecem no resultado

#### Scenario: Colunas explícitas

- **WHEN** a consulta é inspecionada
- **THEN** ela nomeia cada coluna retornada através de `.select({...})` do Drizzle, no mesmo padrão usado pela consulta irmã de faltantes — **não** basta o SQL gerado nomear as colunas implicitamente (o Drizzle já faz isso mesmo com `.select()` vazio, por conhecer o schema); o requisito é sobre a prática de código na camada de repositório, para deixar explícito no código-fonte quais colunas a consulta traz para a aplicação
