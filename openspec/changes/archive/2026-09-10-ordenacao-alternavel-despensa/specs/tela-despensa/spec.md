## MODIFIED Requirements

### Requirement: Ordenação por estado

A despensa SHALL oferecer dois modos de ordenação por estado — "Acabou primeiro" e "Cheio
primeiro". Em "Acabou primeiro", os itens aparecem em ordem de urgência: primeiro os críticos,
depois os em falta, depois os ok; em "Cheio primeiro", a ordem é invertida. Em ambos, dentro de
cada grupo os itens aparecem em ordem alfabética ignorando diferença de caixa. Nenhum dos dois é
o default (ver requisito "Ordenação alfabética").

#### Scenario: Grupos em ordem de urgência (Acabou primeiro)

- **WHEN** o modo "Acabou primeiro" está ativo e a despensa contém itens nos três estados
- **THEN** os críticos aparecem primeiro, seguidos dos em falta e por fim dos ok

#### Scenario: Grupos em ordem invertida (Cheio primeiro)

- **WHEN** o modo "Cheio primeiro" está ativo e a despensa contém itens nos três estados
- **THEN** os ok aparecem primeiro, seguidos dos em falta e por fim dos críticos

#### Scenario: Alfabética dentro do grupo

- **WHEN** um dos dois modos por estado está ativo e dois itens estão no mesmo estado
- **THEN** eles aparecem em ordem alfabética, com "arroz" e "Arroz" tratados de forma
  equivalente na ordenação

## ADDED Requirements

### Requirement: Ordenação alfabética

A despensa SHALL oferecer dois modos de ordenação por nome — "Nome (A-Z)" e "Nome (Z-A)",
ignorando diferença de caixa. "Nome (A-Z)" é o modo default da tela.

#### Scenario: Itens em ordem alfabética (A-Z)

- **WHEN** o modo "Nome (A-Z)" está ativo
- **THEN** os itens aparecem ordenados pelo nome em ordem crescente, com "arroz" e "Arroz"
  tratados de forma equivalente

#### Scenario: Itens em ordem alfabética inversa (Z-A)

- **WHEN** o modo "Nome (Z-A)" está ativo
- **THEN** os itens aparecem ordenados pelo nome em ordem decrescente, com "arroz" e "Arroz"
  tratados de forma equivalente

#### Scenario: Default de uma casa sem preferência gravada

- **WHEN** a casa nunca gravou uma preferência de ordenação
- **THEN** a despensa abre no modo "Nome (A-Z)"

### Requirement: Ordenação por quantidade

A despensa SHALL oferecer dois modos de ordenação por quantidade — "Menor quantidade" (crescente
por `quantidade_atual`) e "Maior quantidade" (decrescente). Quando dois itens têm a mesma
quantidade, o desempate SHALL ser alfabético, ignorando diferença de caixa.

#### Scenario: Itens em ordem crescente de quantidade

- **WHEN** o modo "Menor quantidade" está ativo
- **THEN** os itens aparecem ordenados do que tem menos para o que tem mais em estoque

#### Scenario: Itens em ordem decrescente de quantidade

- **WHEN** o modo "Maior quantidade" está ativo
- **THEN** os itens aparecem ordenados do que tem mais para o que tem menos em estoque

### Requirement: Menu de seleção do modo de ordenação

A despensa SHALL exibir um ícone de menu, posicionado entre a busca e o botão de novo produto,
que abre uma lista com as seis opções de ordenação — Nome (A-Z), Nome (Z-A), Acabou primeiro,
Cheio primeiro, Menor quantidade, Maior quantidade — agrupadas visualmente em três pares
separados por divisores, sem texto de cabeçalho por grupo. Cada opção SHALL exibir um ícone
coerente com o critério (alfabético, medidor de nível, numérico) e a opção correspondente ao
modo ativo SHALL exibir uma marca de seleção, além do próprio texto — nenhum canal depende só de
cor. A preferência escolhida SHALL persistir por casa entre aberturas do app, pelo mesmo
mecanismo já usado para tema e para o modo corredor/agrupado.

#### Scenario: Selecionar um modo no menu

- **WHEN** o usuário abre o menu de ordenação e toca em uma das seis opções
- **THEN** o menu fecha e a lista passa a exibir os itens no modo escolhido, com a marca de
  seleção agora nessa opção

#### Scenario: Preferência sobrevive a reabrir o app

- **WHEN** o usuário escolhe o modo "Acabou primeiro" e fecha e reabre o app
- **THEN** a despensa abre novamente no modo "Acabou primeiro"

### Requirement: Posição congelada por sessão nos modos por estado e por quantidade

Nos modos por estado (Acabou/Cheio primeiro) e por quantidade (Menor/Maior quantidade), a
posição de cada item na lista SHALL permanecer congelada durante toda a permanência do usuário
na tela, mesmo quando uma alteração de quantidade (incluindo pelo stepper de ajuste rápido) muda
o estado do item ou o valor pelo qual a lista está ordenada. O estado visual do item (altura da
linha d'água, cor da régua, rótulo textual) SHALL continuar refletindo a quantidade real
imediatamente, independente da posição estar congelada. A ordem SHALL ser recalculada apenas na
próxima vez que a tela for montada — ao navegar para ela novamente, o app retornar de segundo
plano, ou o usuário selecionar um modo diferente no menu (incluindo trocar apenas a direção
dentro do mesmo par) — e explicitamente NÃO em um pull-to-refresh manual dentro da mesma sessão.
Um produto criado durante a sessão SHALL aparecer na lista respeitando aproximadamente a posição
que sua ordenação indicaria, mesmo sem estar no snapshot original; um produto removido ou
inativado durante a sessão SHALL desaparecer normalmente da lista. Nos modos por nome (A-Z/Z-A)
não há congelamento — a ordem por nome já é insensível a mudanças de quantidade.

#### Scenario: Item não muda de posição ao trocar de estado

- **WHEN** o modo "Acabou primeiro" está ativo, o usuário está na tela da despensa e usa o
  stepper para que um item saia do estado crítico para em falta
- **THEN** o item permanece na mesma posição da lista, mas seu chip de estado, cor da régua e
  rótulo já mostram o novo estado

#### Scenario: Item não muda de posição ao trocar de quantidade

- **WHEN** o modo "Menor quantidade" está ativo, o usuário está na tela da despensa e usa o
  stepper para aumentar a quantidade de um item, mudando sua posição relativa esperada
- **THEN** o item permanece na mesma posição da lista, mas o número exibido já reflete a nova
  quantidade

#### Scenario: Pull-to-refresh não reordena

- **WHEN** um dos modos por estado ou por quantidade está ativo e o usuário puxa a lista para
  atualizar manualmente, sem sair da tela
- **THEN** a posição dos itens não muda

#### Scenario: Reabrir a tela recalcula a ordem

- **WHEN** um dos modos por estado ou por quantidade está ativo, o usuário sai da tela da
  despensa e volta para ela
- **THEN** a lista é reordenada conforme o critério ativo e os valores atuais de cada item

#### Scenario: Trocar de direção no mesmo par recalcula a ordem

- **WHEN** o modo "Acabou primeiro" está ativo e o usuário seleciona "Cheio primeiro" no menu
- **THEN** a lista é reordenada imediatamente conforme a nova direção

#### Scenario: Item novo entra na sessão em andamento

- **WHEN** um dos modos por estado ou por quantidade está ativo e um novo produto é cadastrado
  enquanto a tela está aberta
- **THEN** o novo item aparece na lista sem deslocar a posição congelada dos itens já
  existentes

#### Scenario: Item removido some da lista congelada

- **WHEN** um dos modos por estado ou por quantidade está ativo e um item existente é removido
  enquanto a tela está aberta
- **THEN** o item some da lista, sem afetar a posição relativa dos demais
