# cadastro-de-produto

## MODIFIED Requirements

### Requirement: Cadastro com campos essenciais em primeiro plano

A tela de cadastro SHALL exigir nome, unidade e quantidade necessária, e SHALL apresentar no máximo quatro campos em primeiro plano. Os campos opcionais — quantidade atual, valor unitário, categoria, marca preferida e observação — SHALL ficar em uma seção recolhida, colapsada por padrão na renderização inicial de `FormularioProduto`. O controle que expande/recolhe essa seção ("Mais opções"/"Menos opções") SHALL ter alvo de toque mínimo de 48×48dp. Ao expandir a seção, a tela SHALL rolar automaticamente até o primeiro campo revelado, sem atribuir foco automático a ele.

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

#### Scenario: Auto-scroll ao expandir "Mais opções" sem foco automático

- **WHEN** o usuário toca em "Mais opções" com o teclado aberto, em qualquer tela que use `FormularioProduto`
- **THEN** a tela rola automaticamente até o primeiro campo revelado, e nenhum campo recebe foco automático

### Requirement: Detalhe e edição do produto

A tela de detalhe SHALL exibir a quantidade atual em destaque, permitir corrigi-la pelo caminho de ajuste, permitir editar todos os campos de cadastro do produto, e exibir no rodapé um resumo do histórico recente de registros com acesso ao histórico completo. A abertura da tela NÃO SHALL atribuir foco automático a nenhum campo de texto nem invocar o teclado, e Voltar com o teclado aberto SHALL fechar o teclado sem sair da tela. O controle que abre o caminho de ajuste (a quantidade em destaque) e o controle que abre o histórico completo SHALL ter, cada um, alvo de toque mínimo de 48×48dp. O botão "Salvar" SHALL permanecer fixo, visível independente da posição de rolagem, do mesmo jeito que o botão "Adicionar" da tela de cadastro de produto novo. Quando um campo focado ficar coberto pelo teclado, a tela SHALL rolar automaticamente até ele ficar visível.

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

#### Scenario: Abertura sem foco automático nem teclado

- **WHEN** o usuário abre o detalhe de um produto a partir da Despensa
- **THEN** nenhum campo de texto recebe foco automático, o teclado não é invocado, e os botões "Usei" e "Repus" permanecem visíveis e tocáveis

#### Scenario: Voltar com teclado aberto fecha só o teclado

- **WHEN** o usuário focou um campo de texto no detalhe (teclado aberto) e pressiona Voltar
- **THEN** o teclado é fechado e a tela de detalhe permanece aberta; um novo Voltar aí sim navega de volta

#### Scenario: Cadastro de produto novo preserva o autofoco

- **WHEN** o usuário abre a tela de cadastro de produto novo
- **THEN** o campo de nome recebe foco automático normalmente (comportamento existente, sem regressão)

#### Scenario: Alvo de toque da quantidade em destaque

- **WHEN** o controle "Corrigir quantidade atual" (a quantidade em display que abre o ajuste) é medido
- **THEN** sua área tocável mede no mínimo 48 por 48 pontos independentes, sem alterar seu tamanho visual

#### Scenario: Alvo de toque do resumo do histórico

- **WHEN** o controle "Ver histórico completo" é medido
- **THEN** sua área tocável mede no mínimo 48 por 48 pontos independentes, sem alterar seu tamanho visual

#### Scenario: Botão Salvar permanece fixo

- **WHEN** o usuário rola o conteúdo da tela de detalhe/edição de produto
- **THEN** o botão "Salvar" continua visível na mesma posição, sem rolar junto com o conteúdo

#### Scenario: Auto-scroll até campo coberto pelo teclado

- **WHEN** um campo do formulário de edição abre coberto pelo teclado (fora da área visível)
- **THEN** a tela rola automaticamente até o campo ficar visível acima do teclado

### Requirement: Remoção lógica de produto

A remoção de um produto SHALL ser lógica. O registro e seu histórico de movimentos NÃO devem ser apagados do banco. O controle de remoção SHALL ser exibido com ícone de lixeira e cor de estado crítico do tema, posicionado abaixo dos demais campos, com rótulo acessível explícito para leitor de tela.

#### Scenario: Item removido some da despensa

- **WHEN** um produto é removido
- **THEN** ele deixa de aparecer na despensa e na lista de compras

#### Scenario: Histórico preservado

- **WHEN** um produto é removido
- **THEN** seus movimentos permanecem no banco

#### Scenario: Remoção pede confirmação

- **WHEN** o usuário aciona a remoção
- **THEN** uma confirmação explícita é exigida antes de concluir

#### Scenario: Botão de remoção com sinal visual de ação destrutiva

- **WHEN** o botão "Tirar da despensa" é exibido na tela de detalhe/edição de produto
- **THEN** ele usa ícone de lixeira, cor de estado crítico do tema (nunca hex literal) e tem `accessibilityLabel` explícito descrevendo a ação
