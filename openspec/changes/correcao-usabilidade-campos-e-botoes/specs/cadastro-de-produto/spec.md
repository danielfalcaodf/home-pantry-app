## MODIFIED Requirements

### Requirement: Cadastro com campos essenciais em primeiro plano

A tela de cadastro SHALL exigir nome, unidade e quantidade necessária, e SHALL apresentar no máximo quatro campos em primeiro plano. Os campos opcionais — quantidade atual, valor unitário, categoria, marca preferida e observação — SHALL ficar em uma seção recolhida, colapsada por padrão na renderização inicial de `FormularioProduto`. O controle que expande/recolhe essa seção ("Mais opções"/"Menos opções") SHALL ter alvo de toque mínimo de 48×48dp. Os campos numéricos (quantidade necessária, quantidade atual, valor unitário) SHALL ser rejeitados com erro em texto quando o valor exceder um teto de sanidade, em vez de aceitos sem confirmação.

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

#### Scenario: Alvo de toque do controle "Mais opções"

- **WHEN** o controle "Mais opções"/"Menos opções" é medido, em qualquer tela que use `FormularioProduto` (Cadastrar produto ou Detalhe do produto)
- **THEN** sua área tocável mede no mínimo 48 por 48 pontos independentes, sem alterar seu tamanho visual

#### Scenario: Quantidade acima do teto de sanidade é rejeitada

- **WHEN** o usuário informa um valor de quantidade necessária, quantidade atual ou valor unitário acima do teto de sanidade definido e tenta salvar
- **THEN** o campo exibe erro em texto explicando o limite, e o produto não é salvo com esse valor

### Requirement: Autocomplete de categoria a partir do existente

O campo de categoria SHALL oferecer as categorias já existentes antes de permitir digitar uma nova, e o valor SHALL ser normalizado pelo domínio antes de gravar. A lista de sugestões exibida em `FormularioProduto` SHALL aparecer ao receber foco, mesmo antes de qualquer texto ser digitado, e SHALL ser filtrada pelo texto já digitado assim que houver algum. Escolher uma sugestão SHALL preencher o campo com exatamente o valor oferecido, sem variação de caixa ou espaçamento.

#### Scenario: Sugestões vêm dos dados

- **WHEN** o campo de categoria recebe foco
- **THEN** as categorias já usadas na casa são oferecidas

#### Scenario: Sugestões aparecem antes de digitar

- **WHEN** o campo de categoria recebe foco e o usuário ainda não digitou nada
- **THEN** as categorias já existentes já estão visíveis como sugestão, sem exigir digitar um prefixo primeiro

#### Scenario: Escolher existente evita variante

- **WHEN** o usuário digita "limp" e escolhe a sugestão "Limpeza"
- **THEN** a categoria gravada é exatamente "Limpeza"

#### Scenario: Categoria nova é normalizada

- **WHEN** o usuário digita " bebidas " como categoria nova
- **THEN** a categoria gravada é "Bebidas"

#### Scenario: Texto cru nunca é gravado

- **WHEN** qualquer categoria é gravada
- **THEN** ela passou pela normalização do domínio
