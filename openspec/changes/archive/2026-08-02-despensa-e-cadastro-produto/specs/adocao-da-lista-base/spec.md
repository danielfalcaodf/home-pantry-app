## ADDED Requirements

### Requirement: Estado vazio convida a adotar a lista base

Quando a despensa não tiver nenhum produto, o app SHALL exibir um convite para começar pela lista de itens comuns, com uma ação explícita. O texto NÃO deve ser um aviso seco.

#### Scenario: Convite exibido

- **WHEN** a despensa está vazia
- **THEN** é exibido um convite para começar pelos itens que quase toda casa tem, com um botão de ação

#### Scenario: Convite não bloqueia o cadastro manual

- **WHEN** o estado vazio está sendo exibido
- **THEN** a ação de cadastrar um produto do zero permanece acessível

### Requirement: Adoção item a item

A tela de adoção SHALL apresentar os itens da lista base já marcados, permitir desmarcar individualmente, e criar **apenas** os itens marcados.

#### Scenario: Adoção completa

- **WHEN** o usuário confirma sem desmarcar nada
- **THEN** todos os itens da lista base são criados

#### Scenario: Adoção parcial

- **WHEN** o usuário desmarca parte dos itens e confirma
- **THEN** apenas os itens marcados são criados

#### Scenario: Adoção mínima permitida

- **WHEN** o usuário mantém apenas dez itens marcados e confirma
- **THEN** apenas esses dez são criados, sem exigência de quantidade mínima maior

#### Scenario: Nenhum item marcado

- **WHEN** o usuário desmarca todos e confirma
- **THEN** nenhum produto é criado e ele retorna ao estado vazio

### Requirement: Adoção é uma escrita atômica e offline

A criação dos itens adotados SHALL ocorrer em uma única transação e SHALL funcionar sem conexão de rede.

#### Scenario: Criação em bloco

- **WHEN** quarenta itens são adotados
- **THEN** eles são criados em uma única transação

#### Scenario: Falha não deixa despensa parcial

- **WHEN** a criação em bloco falha
- **THEN** nenhum item é criado e a mensagem de erro oferece tentar novamente

#### Scenario: Funciona offline

- **WHEN** o aparelho está sem conexão
- **THEN** a adoção conclui normalmente

### Requirement: Itens adotados chegam ajustáveis

Os itens criados a partir da lista base SHALL nascer com quantidade atual zero, uma quantidade necessária sugerida maior que zero, categoria normalizada e unidade coerente com o item.

#### Scenario: Estado inicial dos adotados

- **WHEN** um item da lista base é criado
- **THEN** sua quantidade atual é zero e sua quantidade necessária sugerida é maior que zero

#### Scenario: Item adotado aparece como crítico

- **WHEN** a adoção conclui
- **THEN** os itens criados aparecem na despensa no estado crítico, prontos para serem ajustados ou repostos

#### Scenario: Edição posterior livre

- **WHEN** o usuário abre um item adotado
- **THEN** todos os campos podem ser editados como em qualquer produto cadastrado manualmente
