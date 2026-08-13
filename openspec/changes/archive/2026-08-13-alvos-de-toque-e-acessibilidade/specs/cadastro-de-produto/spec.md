## MODIFIED Requirements

### Requirement: Cadastro com campos essenciais em primeiro plano

A tela de cadastro SHALL exigir nome, unidade e quantidade necessária, e SHALL apresentar no máximo quatro campos em primeiro plano. Os campos opcionais — quantidade atual, valor unitário, categoria, marca preferida e observação — SHALL ficar em uma seção recolhida. O controle que expande/recolhe essa seção ("Mais opções"/"Menos opções") SHALL ter alvo de toque mínimo de 48×48dp.

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

### Requirement: Detalhe e edição do produto

A tela de detalhe SHALL exibir a quantidade atual em destaque, permitir corrigi-la pelo caminho de ajuste, permitir editar todos os campos de cadastro do produto, e exibir no rodapé um resumo do histórico recente de registros com acesso ao histórico completo. O controle que abre o caminho de ajuste (a quantidade em destaque) e o controle que abre o histórico completo SHALL ter, cada um, alvo de toque mínimo de 48×48dp.

#### Scenario: Quantidade em destaque

- **WHEN** a tela de detalhe é aberta
- **THEN** a quantidade atual é exibida no papel tipográfico de display, no topo

#### Scenario: Edição persistida

- **WHEN** o usuário altera um campo de cadastro e salva
- **THEN** a alteração é gravada e a lista da despensa reflete a mudança

#### Scenario: Correção da quantidade atual pelo ajuste

- **WHEN** o usuário toca na quantidade atual
- **THEN** o caminho de ajuste é aberto, gravando um movimento ao confirmar uma quantidade diferente

#### Scenario: Quantidade atual não é campo de texto solto

- **WHEN** a tela de detalhe é inspecionada
- **THEN** a quantidade atual NÃO é editável como campo de formulário comum

#### Scenario: Resumo do histórico

- **WHEN** a tela de detalhe é aberta
- **THEN** o rodapé informa quantos registros de consumo foram feitos no período recente, em linguagem do usuário

#### Scenario: Acesso ao histórico completo

- **WHEN** o usuário toca no resumo do histórico
- **THEN** o histórico completo de movimentos daquele produto é aberto

#### Scenario: Alterar quantidade necessária muda o estado

- **WHEN** a quantidade necessária é aumentada acima da quantidade atual
- **THEN** o item passa a aparecer como faltando na despensa, sem gravar nenhum movimento

#### Scenario: Alvo de toque da quantidade em destaque

- **WHEN** o controle "Corrigir quantidade atual" (a quantidade em display que abre o ajuste) é medido
- **THEN** sua área tocável mede no mínimo 48 por 48 pontos independentes, sem alterar seu tamanho visual

#### Scenario: Alvo de toque do resumo do histórico

- **WHEN** o controle "Ver histórico completo" é medido
- **THEN** sua área tocável mede no mínimo 48 por 48 pontos independentes, sem alterar seu tamanho visual
