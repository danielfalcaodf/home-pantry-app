## ADDED Requirements

### Requirement: Painel inferior convive com o teclado

Todo painel inferior que contém campo de texto — o teclado de quantidade, o item avulso, o
preço do produto, o ajuste de compra e o ajuste de estoque — SHALL manter visíveis, com o
teclado aberto, o campo em foco e a ação de confirmar. Nenhum desses elementos SHALL ficar
coberto pelo teclado em nenhum momento.

A técnica de apresentação é livre, mas SHALL ser uma que receba os eventos de teclado. O
`<Modal>` do React Native abre uma janela nativa separada, fora do alcance do
`KeyboardProvider` montado na raiz do app; qualquer solução que dependa desse provider e viva
dentro de um `<Modal>` NÃO satisfaz este requisito, ainda que o componente de compensação
esteja presente na árvore.

Este requisito SHALL ser verificado no aparelho, medindo a posição dos elementos com o teclado
aberto — nunca apenas pela presença do componente de compensação no código. A ausência dessa
verificação é o que permitiu o defeito sobreviver a uma correção anterior.

#### Scenario: Campo e confirmação visíveis com o teclado aberto

- **WHEN** o usuário abre um painel inferior com campo de texto e o teclado está aberto
- **THEN** o campo em foco e o botão de confirmar permanecem inteiramente visíveis acima do
  teclado, e o conteúdo digitado é legível

#### Scenario: Teclado de quantidade no caminho crítico

- **WHEN** o usuário abre o teclado de quantidade por toque longo no stepper
- **THEN** o campo e os botões "Usei" e "Repus" ficam acima do teclado, e o registro é
  concluído sem que a pessoa precise fechar o teclado ou rolar o painel

#### Scenario: Painel mais alto que o espaço livre

- **WHEN** o conteúdo do painel não cabe no espaço acima do teclado
- **THEN** o painel se torna rolável mantendo a ação de confirmar alcançável, em vez de
  empurrar o conteúdo para fora da tela

### Requirement: Painel inferior com foco automático entrega o teclado

O painel inferior cuja única função é digitar um valor — teclado de quantidade, item avulso e
preço do produto — SHALL abrir com o campo focado **e com o teclado já visível**. Declarar
`autoFocus` no campo não é suficiente se o teclado não subir: o critério é o teclado visível,
não a propriedade presente.

Isto NÃO se aplica à tela de detalhe do produto, onde `cadastro-de-produto` exige
explicitamente o contrário — abrir sem foco automático e sem teclado, para não cobrir "Usei" e
"Repus".

#### Scenario: Abrir o painel já com o teclado

- **WHEN** o usuário abre um painel inferior de digitação de valor
- **THEN** o campo está focado e o teclado já está visível, sem exigir um toque adicional no
  campo

#### Scenario: Fechar o painel devolve o foco

- **WHEN** o usuário fecha o painel
- **THEN** o teclado é dispensado junto com o painel, sem deixar o teclado aberto sobre a tela
  de trás
