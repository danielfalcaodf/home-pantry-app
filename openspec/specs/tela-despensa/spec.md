# tela-despensa

## Requirements

### Requirement: Ordenação por estado

A despensa SHALL listar os itens em ordem de urgência — primeiro os críticos, depois os em falta, depois os ok — e, dentro de cada grupo, em ordem alfabética ignorando diferença de caixa.

#### Scenario: Grupos em ordem de urgência

- **WHEN** a despensa contém itens nos três estados
- **THEN** os críticos aparecem primeiro, seguidos dos em falta e por fim dos ok

#### Scenario: Alfabética dentro do grupo

- **WHEN** dois itens estão no mesmo estado
- **THEN** eles aparecem em ordem alfabética, com "arroz" e "Arroz" tratados de forma equivalente na ordenação

### Requirement: Agrupamento por categoria no filtro amplo

Quando o filtro ativo for "Tudo", a lista SHALL ser agrupada por categoria, com um cabeçalho fixo por grupo. Nos demais filtros, o cabeçalho de categoria NÃO deve aparecer.

#### Scenario: Cabeçalho fixo no filtro amplo

- **WHEN** o filtro "Tudo" está ativo e o usuário rola a lista
- **THEN** o cabeçalho da categoria corrente permanece fixo no topo da área de conteúdo

#### Scenario: Sem cabeçalho nos filtros de estado

- **WHEN** o filtro "Acabou" ou "Faltando" está ativo
- **THEN** nenhum cabeçalho de categoria é exibido

#### Scenario: Itens sem categoria agrupados

- **WHEN** existem itens sem categoria definida
- **THEN** eles são agrupados sob um cabeçalho próprio, ao final da lista

### Requirement: Filtro por estado com contagem

A despensa SHALL exibir chips de filtro por estado, cada um com a contagem de itens naquele estado, e SHALL filtrar a lista ao chip ativo.

#### Scenario: Contagens refletem a despensa

- **WHEN** a despensa tem 3 itens zerados e 12 abaixo do mínimo
- **THEN** os chips exibem as contagens 3 e 12 respectivamente

#### Scenario: Filtro aplicado

- **WHEN** o chip de itens zerados é ativado
- **THEN** apenas os itens no estado crítico permanecem na lista

#### Scenario: Contagem atualiza após mudança de quantidade

- **WHEN** a quantidade de um item muda e ele troca de estado
- **THEN** as contagens dos chips são atualizadas sem recarregar a tela

#### Scenario: Chip sem itens

- **WHEN** nenhum item está no estado crítico
- **THEN** o chip correspondente exibe contagem zero e permanece acionável

### Requirement: Filtro por categoria

A despensa SHALL permitir filtrar por categoria, a partir das categorias efetivamente existentes.

#### Scenario: Categorias oferecidas vêm dos dados

- **WHEN** o filtro de categoria é aberto
- **THEN** ele lista apenas categorias que existem em algum produto da casa

#### Scenario: Combinação com filtro de estado

- **WHEN** um filtro de estado e um de categoria estão ativos simultaneamente
- **THEN** a lista mostra apenas os itens que atendem aos dois

### Requirement: Busca por nome

A despensa SHALL permitir buscar itens por nome, ignorando diferença de caixa e acentuação.

#### Scenario: Busca parcial

- **WHEN** o usuário digita parte do nome de um item
- **THEN** a lista mostra os itens cujo nome contém o trecho digitado

#### Scenario: Busca ignora acento e caixa

- **WHEN** o usuário busca por "acucar"
- **THEN** um item chamado "Açúcar" é encontrado

#### Scenario: Busca sem resultado oferece cadastro

- **WHEN** a busca não encontra nenhum item
- **THEN** é exibida a mensagem de nenhum item com esse nome e uma ação para cadastrar o termo buscado

### Requirement: Lista reativa à escrita

A lista SHALL refletir escritas no banco sem recarregamento manual e sem gerenciamento de cache em memória.

#### Scenario: Nova escrita reflete na lista

- **WHEN** um produto é criado, editado ou tem a quantidade alterada
- **THEN** a lista é atualizada automaticamente

#### Scenario: Sem segunda fonte de verdade

- **WHEN** a implementação da tela é inspecionada
- **THEN** ela não mantém cópia dos produtos em estado global nem em cache de requisição

### Requirement: Desempenho da lista longa

A lista SHALL permanecer fluida com o volume esperado de produtos da casa.

#### Scenario: Rolagem com volume real

- **WHEN** a despensa contém 300 itens
- **THEN** a rolagem permanece fluida e o preenchimento de cada linha aparece já no valor final

#### Scenario: Virtualização acima do limiar

- **WHEN** a lista ultrapassa cerca de 150 itens
- **THEN** ela é renderizada por lista virtualizada de alto desempenho
