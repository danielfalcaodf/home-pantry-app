## MODIFIED Requirements

### Requirement: Lista derivada, nunca materializada

A lista de compras SHALL ser composta em tempo de consulta a partir dos produtos cuja quantidade atual é menor que a necessária, unidos aos itens avulsos da compra aberta. NÃO deve existir tabela de lista de compras. A reatividade SHALL ser confiável mesmo em cenários com um único item faltante e após reiniciar o app — não apenas em cenários com múltiplos itens faltantes.

#### Scenario: Item em falta aparece automaticamente

- **WHEN** a quantidade de um produto cai abaixo da necessária
- **THEN** ele passa a aparecer na lista sem nenhuma ação do usuário

#### Scenario: Item reposto sai automaticamente

- **WHEN** a quantidade de um produto volta a atingir a necessária
- **THEN** ele deixa de aparecer na lista

#### Scenario: Sem tabela de lista

- **WHEN** o schema do banco é inspecionado
- **THEN** nenhuma tabela representa a lista de compras

#### Scenario: Lista reativa

- **WHEN** um consumo é registrado na despensa e o usuário abre a lista
- **THEN** a lista já reflete o novo estado, sem recarregamento manual

#### Scenario: Único item faltante aparece de forma confiável

- **WHEN** exatamente um produto está faltante (todos os outros produtos da casa com estoque completo) e a tela Lista de compras é aberta, incluindo depois de reiniciar o app
- **THEN** esse item aparece na lista, sem depender de haver outros itens faltantes ao mesmo tempo

#### Scenario: Lista reflete o estado após reiniciar o app

- **WHEN** um produto se torna faltante e o app é fechado e reaberto (sem nenhuma ação manual de atualizar)
- **THEN** a lista de compras já mostra esse item na primeira renderização, sem exigir navegar para outra aba e voltar

## ADDED Requirements

### Requirement: Lista navegável com rolagem

A tela Lista de compras SHALL renderizar seus itens dentro de um componente com rolagem (mesmo padrão da Despensa), garantindo que todos os itens e a ação de adicionar item avulso permaneçam acessíveis independentemente do tamanho da lista.

#### Scenario: Lista longa permanece navegável

- **WHEN** a lista de compras tem itens suficientes para exceder a altura da tela
- **THEN** o usuário consegue rolar até o último item e até a ação "Adicionar item avulso"

### Requirement: Editar preço de referência de produto direto na lista

Um produto normal (não avulso) faltante SHALL ter um caminho de edição do seu preço de referência diretamente na tela Lista de compras, sem exigir abrir o Modo Compra ou o formulário completo de edição do produto.

#### Scenario: Editar preço de produto sem sair da lista

- **WHEN** o usuário toca a ação de editar preço em um produto faltante na Lista de compras
- **THEN** um caminho de edição focado em preço é aberto, e salvar atualiza o preço de referência do produto

#### Scenario: Produto sem preço pode receber um preço pela primeira vez

- **WHEN** o produto faltante não tem preço de referência (`semPreco`)
- **THEN** o caminho de edição de preço na lista permite definir um valor, não só editar um já existente

#### Scenario: Item avulso continua com seu próprio caminho de edição

- **WHEN** o item da lista é avulso
- **THEN** o toque continua abrindo a edição completa do avulso (nome, quantidade, unidade, preço) — o novo caminho de edição de preço é exclusivo de produtos normais
