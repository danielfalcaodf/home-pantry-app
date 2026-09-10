# repositorios

## Purpose

Definir o padrão Ports & Adapters de persistência: interfaces por agregado (produto,
movimento, compra) em `ports/`, implementações SQLite isoladas em `infrastructure/`, e a regra
de que nenhum código fora da infraestrutura acessa o banco diretamente.
## Requirements
### Requirement: Contratos de persistência por agregado

O sistema SHALL declarar interfaces de repositório separadas por agregado — produto, movimento e compra — em uma camada de portas. Uma interface única e abrangente com todos os métodos do domínio NÃO deve existir.

#### Scenario: Interfaces separadas

- **WHEN** a camada de portas é inspecionada
- **THEN** existem contratos distintos para produto, movimento e compra

#### Scenario: Caso de uso depende do contrato

- **WHEN** um caso de uso precisa persistir
- **THEN** ele recebe o contrato como dependência e NÃO importa a implementação concreta

#### Scenario: Implementação substituível

- **WHEN** um repositório falso é fornecido no lugar do repositório SQLite
- **THEN** o caso de uso funciona sem alteração e sem saber a diferença

### Requirement: Todo acesso ao banco passa pelo repositório

Nenhum código fora da camada de infraestrutura SHALL acessar o cliente de banco, o schema ou construir consultas diretamente.

#### Scenario: Acesso direto é bloqueado

- **WHEN** um arquivo fora da camada de infraestrutura importa o cliente de banco ou o schema
- **THEN** a verificação de fronteiras acusa erro

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
- **THEN** ela nomeia cada coluna retornada através de `.select({...})` do Drizzle, no mesmo padrão usado pela consulta irmã de faltantes — **não** basta o SQL gerado nomear as colunas implicitamente (o Drizzle já faz isso mesmo com `.select()` vazio, por conhecer o schema); o requisito é sobre a prática de código na camada de repositório, para deixar explícito no código-fonte quais colunas a consulta traz para a aplicação

### Requirement: Consulta de faltantes entrega valores brutos

O repositório SHALL fornecer os produtos em falta com a diferença bruta em milésimos e o produto bruto de quantidade por preço, **sem** aplicar arredondamento por unidade nem conversão de moeda. Essas regras pertencem ao domínio e NÃO devem ser replicadas na consulta.

#### Scenario: Diferença bruta retornada

- **WHEN** um produto tem quantidade atual 2500 e necessária 3000
- **THEN** a consulta retorna diferença bruta de 500 milésimos, sem arredondar

#### Scenario: Arredondamento acontece no domínio

- **WHEN** o resultado da consulta é convertido em item da lista de compras
- **THEN** o arredondamento por unidade indivisível é aplicado pela regra de domínio, e não pela consulta

#### Scenario: Predicado casa com o índice parcial

- **WHEN** o plano de execução da consulta é inspecionado
- **THEN** ele usa o índice parcial de produtos em falta

### Requirement: Baixa de estoque em transação única

O repositório SHALL registrar o consumo aplicando, **em uma única transação**, a atualização da quantidade materializada do produto e a inserção do movimento correspondente. As duas escritas NÃO devem ocorrer em chamadas separadas.

#### Scenario: Escrita conjunta

- **WHEN** uma baixa é registrada com sucesso
- **THEN** a quantidade do produto foi atualizada e existe exatamente um movimento novo, ambos gravados

#### Scenario: Falha reverte tudo

- **WHEN** a inserção do movimento falha no meio da transação
- **THEN** a quantidade do produto permanece com o valor anterior e nenhum movimento é gravado

#### Scenario: Saldo resultante reflete o valor real

- **WHEN** o movimento é gravado
- **THEN** sua quantidade resultante é o saldo do produto após a atualização, e não um valor calculado antes dela

#### Scenario: Baixa não deixa quantidade negativa

- **WHEN** uma baixa maior que o saldo é registrada
- **THEN** a quantidade final do produto é 0 e a operação conclui com sucesso

#### Scenario: Situação de sincronização marcada como pendente

- **WHEN** a quantidade do produto é atualizada por uma escrita
- **THEN** a situação de sincronização do produto passa a pendente

### Requirement: Trilha de movimentos é append-only

O repositório de movimento SHALL apenas inserir e consultar. Ele NÃO deve expor nenhuma operação de atualização ou remoção de movimento.

#### Scenario: Contrato sem escrita destrutiva

- **WHEN** o contrato do repositório de movimento é inspecionado
- **THEN** ele não declara nenhum método de atualização ou de remoção

#### Scenario: Desfazer insere movimento inverso

- **WHEN** um consumo registrado é desfeito
- **THEN** um novo movimento de sinal oposto é inserido, e o movimento original permanece intacto no banco

#### Scenario: Histórico por produto, mais recente primeiro

- **WHEN** o histórico de um produto é consultado
- **THEN** os movimentos vêm ordenados do mais recente para o mais antigo

### Requirement: Finalização de compra em transação única

O repositório de compra SHALL aplicar, em **uma única transação**, todas as reposições dos itens marcados, os movimentos correspondentes, as atualizações de preço confirmadas, e a mudança de situação da compra com seu total pago.

#### Scenario: Compra inteira ou nada

- **WHEN** a finalização falha no processamento do terceiro de cinco itens
- **THEN** nenhum produto teve a quantidade alterada, nenhum movimento foi gravado, e a compra permanece aberta

#### Scenario: Reposição aplicada a todos os marcados

- **WHEN** a finalização de uma compra com três itens marcados conclui
- **THEN** os três produtos tiveram a quantidade somada e três movimentos de reposição foram gravados

#### Scenario: Itens não marcados permanecem

- **WHEN** uma compra é finalizada com itens não marcados
- **THEN** esses itens não geram reposição nem movimento

#### Scenario: Total pago calculado na finalização

- **WHEN** a compra é finalizada
- **THEN** seu total pago é a soma das quantidades compradas pelos respectivos valores pagos dos itens marcados

#### Scenario: Situação finalizada exige data

- **WHEN** uma compra passa para a situação finalizada
- **THEN** sua data de finalização está preenchida, e o banco rejeita o contrário

### Requirement: Consulta de itens de compra sem consultas repetidas

A consulta dos itens de uma compra SHALL trazer os dados do produto associado em uma única consulta com junção externa, preservando os itens avulsos que não têm produto.

#### Scenario: Uma consulta para todos os itens

- **WHEN** os itens de uma compra com quinze itens são carregados
- **THEN** apenas uma consulta é executada

#### Scenario: Item avulso não desaparece

- **WHEN** a compra contém itens avulsos sem produto associado
- **THEN** eles aparecem no resultado com o nome avulso preenchido

### Requirement: Remoção lógica de produto limpa item "fora da lista por agora"

Ao remover logicamente um produto, o repositório SHALL apagar, na mesma transação, as linhas
de `compra_item` marcadas como "fora da lista por agora" (`excluido = true`) ligadas a esse
produto. Item pendente comum (`comprado = false`, `excluido = false`) e item já comprado NÃO
devem ser removidos.

#### Scenario: Item "fora da lista por agora" some ao excluir o produto

- **WHEN** um produto tem um item com `excluido = true` na compra aberta e o produto é removido
  logicamente
- **THEN** a linha de `compra_item` correspondente deixa de existir

#### Scenario: Item pendente comum permanece ao excluir o produto

- **WHEN** um produto tem um item pendente comum (`comprado = false`, `excluido = false`) na
  compra aberta e o produto é removido logicamente
- **THEN** a linha de `compra_item` permanece, ainda apontando para o produto (agora
  soft-deletado) — necessário para o detalhe da própria compra continuar funcionando

#### Scenario: Item já comprado não é afetado

- **WHEN** um produto tem um item com `comprado = true` em uma compra fechada e o produto é
  removido logicamente
- **THEN** a linha de `compra_item` permanece, ainda apontando para o produto (o FK
  `onDelete:'set null'` só dispara em DELETE físico, que a remoção lógica nunca faz)

