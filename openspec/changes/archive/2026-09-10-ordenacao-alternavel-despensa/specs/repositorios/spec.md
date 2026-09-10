## MODIFIED Requirements

### Requirement: Consulta da despensa com estado e ordenação

O repositório de produto SHALL fornecer a lista de produtos ativos e não removidos da casa, com
colunas explícitas, aceitando um modo de ordenação dentre seis valores: `alfabetica`,
`alfabeticaInversa`, `estado`, `estadoInverso`, `quantidade`, `quantidadeInversa`. Nos modos
`estado`/`estadoInverso`, a ordenação SHALL ser por estado — crítico, depois em falta, depois ok
(ou o inverso em `estadoInverso`) — e alfabeticamente dentro de cada grupo, ignorando caixa. Nos
modos `alfabetica`/`alfabeticaInversa`, a ordenação SHALL ser só pelo nome, ignorando caixa (A-Z
ou Z-A). Nos modos `quantidade`/`quantidadeInversa`, a ordenação SHALL ser por
`quantidade_atual` (crescente ou decrescente), com o nome como desempate alfabético ignorando
caixa quando a quantidade for igual.

#### Scenario: Ordenação por estado

- **WHEN** o modo `estado` é solicitado e a despensa contém um produto ok, um zerado e um em
  falta
- **THEN** a ordem retornada é o zerado, depois o em falta, depois o ok

#### Scenario: Ordenação por estado invertida

- **WHEN** o modo `estadoInverso` é solicitado e a despensa contém um produto ok, um zerado e um
  em falta
- **THEN** a ordem retornada é o ok, depois o em falta, depois o zerado

#### Scenario: Ordem alfabética dentro do grupo por estado

- **WHEN** o modo `estado` ou `estadoInverso` é solicitado e dois produtos estão no mesmo estado
- **THEN** eles são retornados em ordem alfabética, ignorando diferença de caixa

#### Scenario: Ordenação alfabética pura

- **WHEN** o modo `alfabetica` é solicitado
- **THEN** os produtos são retornados em ordem alfabética pelo nome (A-Z), ignorando diferença
  de caixa, independente do estado de cada um

#### Scenario: Ordenação alfabética inversa

- **WHEN** o modo `alfabeticaInversa` é solicitado
- **THEN** os produtos são retornados em ordem alfabética inversa pelo nome (Z-A), ignorando
  diferença de caixa

#### Scenario: Ordenação por menor quantidade

- **WHEN** o modo `quantidade` é solicitado e a despensa contém produtos com quantidades
  diferentes
- **THEN** os produtos são retornados em ordem crescente de `quantidade_atual`

#### Scenario: Ordenação por maior quantidade

- **WHEN** o modo `quantidadeInversa` é solicitado e a despensa contém produtos com quantidades
  diferentes
- **THEN** os produtos são retornados em ordem decrescente de `quantidade_atual`

#### Scenario: Desempate alfabético na ordenação por quantidade

- **WHEN** o modo `quantidade` ou `quantidadeInversa` é solicitado e dois produtos têm a mesma
  `quantidade_atual`
- **THEN** eles são retornados em ordem alfabética entre si, ignorando diferença de caixa

#### Scenario: Removidos e inativos são excluídos

- **WHEN** existem produtos removidos logicamente ou inativos
- **THEN** eles NÃO aparecem no resultado, em nenhum dos seis modos

#### Scenario: Colunas explícitas

- **WHEN** a consulta é inspecionada
- **THEN** ela nomeia cada coluna retornada através de `.select({...})` do Drizzle, no mesmo
  padrão usado pela consulta irmã de faltantes — **não** basta o SQL gerado nomear as colunas
  implicitamente (o Drizzle já faz isso mesmo com `.select()` vazio, por conhecer o schema); o
  requisito é sobre a prática de código na camada de repositório, para deixar explícito no
  código-fonte quais colunas a consulta traz para a aplicação
