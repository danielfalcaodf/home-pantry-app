## ADDED Requirements

### Requirement: Ação primária de uma tela não depende do tamanho do conteúdo

A ação primária de uma tela — aquela que conclui o que a tela existe para fazer — SHALL estar
alcançável em qualquer estado da tela, sem depender de rolagem. Em telas roláveis, ela SHALL
ficar ancorada, e NÃO no fluxo do conteúdo.

O critério é comportamental, não estético: a posição da ação NÃO SHALL variar conforme a
quantidade de campos exibidos, o estado de seções expansíveis, ou a presença do teclado. Uma
ação que sai da dobra quando a pessoa expande uma seção ou abre o teclado não satisfaz este
requisito, ainda que esteja visível no estado inicial da tela.

A ancoragem SHALL respeitar o inset inferior do sistema, conforme a capability
`bordas-do-sistema` — ancorar sem descontar o inset apenas troca "fora da dobra" por "dentro
da faixa de gestos".

#### Scenario: Ação visível com seção expansível aberta

- **WHEN** o usuário expande a seção de campos opcionais de um formulário
- **THEN** a ação de concluir continua visível, na mesma posição de antes

#### Scenario: Ação visível com o teclado aberto

- **WHEN** o usuário está digitando em qualquer campo do formulário, com o teclado aberto
- **THEN** a ação de concluir continua visível e tocável, sem exigir rolagem nem fechar o
  teclado

#### Scenario: Ação ancorada respeita a faixa de gestos

- **WHEN** a ação primária está ancorada no rodapé
- **THEN** a borda inferior do alvo de toque termina acima do início da faixa de gestos do
  sistema

### Requirement: Ação de adicionar item a uma lista não fica no fim da lista

A ação que adiciona um item a uma lista NÃO SHALL ser posicionada após o último item da lista.
Ela SHALL estar alcançável a partir do topo da tela, sem rolagem proporcional ao tamanho da
lista.

Uma lista cresce; a distância até a ação que a alimenta não pode crescer junto. Numa despensa
de 41 itens, um rodapé de lista fica a milhares de pixels de rolagem da posição inicial.

#### Scenario: Adicionar com a lista cheia

- **WHEN** a lista contém dezenas de itens e o usuário quer adicionar um item avulso
- **THEN** a ação de adicionar está alcançável sem rolar até o fim da lista

#### Scenario: Distância não cresce com a lista

- **WHEN** a quantidade de itens da lista aumenta
- **THEN** a rolagem necessária para alcançar a ação de adicionar não aumenta

### Requirement: A mesma ação mantém a mesma forma em todos os estados da tela

Uma ação oferecida em mais de um estado da mesma tela SHALL ter a mesma forma, o mesmo papel
acessível e o mesmo alvo de toque em todos eles. NÃO SHALL ser um botão num estado e um texto
clicável em outro.

Hoje "Adicionar item avulso" é botão quando a lista está vazia e texto clicável quando a lista
tem itens — a ação piora de forma exatamente quando fica mais difícil de alcançar.

#### Scenario: Estado vazio e estado com itens oferecem a mesma ação

- **WHEN** a mesma ação é oferecida no estado vazio e no estado preenchido de uma tela
- **THEN** ela é o mesmo componente nos dois, com o mesmo papel acessível e o mesmo alvo de
  toque mínimo
