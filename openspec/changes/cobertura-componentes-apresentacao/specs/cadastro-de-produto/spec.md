## MODIFIED Requirements

### Requirement: Cadastro com campos essenciais em primeiro plano

A tela de cadastro SHALL exigir nome, unidade e quantidade necessária, e SHALL apresentar no máximo quatro campos em primeiro plano. Os campos opcionais — quantidade atual, valor unitário, categoria, marca preferida e observação — SHALL ficar em uma seção recolhida, colapsada por padrão na renderização inicial de `FormularioProduto`.

#### Scenario: Cadastro mínimo

- **WHEN** o usuário preenche nome, unidade e quantidade necessária e salva
- **THEN** o produto é criado com quantidade atual zero e valor unitário zero

#### Scenario: Campos opcionais recolhidos

- **WHEN** a tela de cadastro é aberta
- **THEN** os campos opcionais não estão visíveis até que a seção de mais opções seja expandida

#### Scenario: Quantidade necessária decimal

- **WHEN** o usuário informa 1,5 na unidade quilograma
- **THEN** o produto é salvo com a quantidade necessária correspondente

#### Scenario: Quantidade necessária zero é rejeitada

- **WHEN** o usuário informa quantidade necessária zero e tenta salvar
- **THEN** o campo exibe erro em texto e o produto não é criado

#### Scenario: Nome vazio é rejeitado

- **WHEN** o usuário deixa o nome em branco e tenta salvar
- **THEN** o campo exibe erro em texto e o produto não é criado

#### Scenario: Vocabulário da interface

- **WHEN** o campo de quantidade necessária é rotulado
- **THEN** o rótulo usa linguagem do usuário, como quanto se quer ter em casa, e não o termo de sistema

### Requirement: Autocomplete de categoria a partir do existente

O campo de categoria SHALL oferecer as categorias já existentes antes de permitir digitar uma nova, e o valor SHALL ser normalizado pelo domínio antes de gravar. A lista de sugestões exibida em `FormularioProduto` SHALL ser filtrada pelo texto já digitado, e escolher uma sugestão SHALL preencher o campo com exatamente o valor oferecido, sem variação de caixa ou espaçamento.

#### Scenario: Sugestões vêm dos dados

- **WHEN** o campo de categoria recebe foco
- **THEN** as categorias já usadas na casa são oferecidas

#### Scenario: Escolher existente evita variante

- **WHEN** o usuário digita "limp" e escolhe a sugestão "Limpeza"
- **THEN** a categoria gravada é exatamente "Limpeza"

#### Scenario: Categoria nova é normalizada

- **WHEN** o usuário digita " bebidas " como categoria nova
- **THEN** a categoria gravada é "Bebidas"

#### Scenario: Texto cru nunca é gravado

- **WHEN** qualquer categoria é gravada
- **THEN** ela passou pela normalização do domínio

### Requirement: Nome duplicado é impedido com caminho de saída

O sistema SHALL impedir dois produtos ativos com o mesmo nome na mesma casa, ignorando diferença de caixa. Ao detectar duplicidade, SHALL informar em linguagem clara e oferecer ver o item existente ou alterar o nome. A ação "ver o item existente" SHALL navegar para a tela de detalhe do produto cujo id é o do item duplicado detectado, não um id arbitrário.

#### Scenario: Duplicidade detectada antes de salvar

- **WHEN** o usuário digita um nome que já existe na despensa
- **THEN** é exibida a mensagem informando que já existe um item com aquele nome, com a ação de ver o item existente

#### Scenario: Salvar exige nome diferenciado

- **WHEN** o usuário insiste em criar um item com nome já existente
- **THEN** ele é orientado a diferenciar o nome, e a criação com o nome idêntico não é concluída

#### Scenario: Diferença apenas de caixa também é duplicidade

- **WHEN** existe "Arroz" e o usuário tenta criar "arroz"
- **THEN** a duplicidade é detectada

#### Scenario: Nome de item removido pode ser reutilizado

- **WHEN** um item foi removido e o usuário cria outro com o mesmo nome
- **THEN** a criação é concluída normalmente

#### Scenario: Navegação para o item existente usa o id correto

- **WHEN** o usuário toca a ação "ver item existente" na mensagem de duplicidade
- **THEN** a tela de detalhe aberta corresponde ao produto que já existia, identificado pelo mesmo id detectado na checagem
