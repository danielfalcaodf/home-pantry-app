## MODIFIED Requirements

### Requirement: Componente de texto tipografado

O sistema SHALL fornecer um componente de texto que aceita apenas os papéis tipográficos declarados na escala, e que aplica família, tamanho, altura de linha, peso e espaçamento de acordo com o papel.

O papel SHALL ser compatível com o tipo de conteúdo que recebe. O papel de micro-rótulo, que aplica caixa alta e espaçamento aumentado, SHALL receber apenas etiquetas curtas — NÃO SHALL receber frases, orações com pontuação, nem texto explicativo. Prosa em caixa alta a tamanho pequeno elimina as ascendentes e descendentes que o olho usa para reconhecer palavra, e é especialmente danosa quando o conteúdo é um aviso que a pessoa precisa ler antes de decidir.

#### Scenario: Papel válido resolve a família correta

- **WHEN** o papel de dado é usado
- **THEN** o texto renderiza na família monoespaçada com figuras tabulares

#### Scenario: Papel inválido é rejeitado

- **WHEN** um papel fora da escala é passado
- **THEN** o compilador de tipos rejeita, comprovado por um teste de tipo (`@ts-expect-error` passando um papel fora da escala tipográfica ao componente `Texto`) validado via `tsc --noEmit`

#### Scenario: Números não deslocam o layout

- **WHEN** um número renderizado com o papel de dado muda de 10 para 9
- **THEN** a largura ocupada não muda e nenhum elemento adjacente se desloca

#### Scenario: Prosa não usa o papel de micro-rótulo

- **WHEN** um texto que é uma frase completa, com pontuação, precisa ser exibido
- **THEN** ele usa um papel de corpo, e não o papel de micro-rótulo em caixa alta

#### Scenario: Hierarquia não se inverte

- **WHEN** uma tela exibe rótulos de seção e texto corrido
- **THEN** o texto corrido não é exibido com mais ênfase visual que os rótulos de seção que o organizam

## ADDED Requirements

### Requirement: Atributos de acessibilidade chegam à árvore, não apenas ao código

Papel, rótulo e estado acessíveis de um controle SHALL estar presentes na árvore de
acessibilidade da plataforma. Declará-los no código não é suficiente: o React Native colapsa a
subárvore de um elemento tocável que não tem rótulo próprio e sintetiza o nome acessível
concatenando os textos dos filhos, **descartando** `accessibilityLabel`, `accessibilityRole` e
`accessibilityState` declarados em nós internos.

Por isso, os atributos de acessibilidade de um controle SHALL ser declarados no elemento que
recebe o toque, e NÃO em um filho decorativo dele. Elementos puramente visuais que compõem o
controle SHALL ser marcados como não relevantes para acessibilidade, para não vazarem para o
nome sintetizado.

A conformidade SHALL ser verificada inspecionando a árvore de acessibilidade da plataforma —
nunca apenas lendo o código.

#### Scenario: Papel e estado presentes na árvore

- **WHEN** a árvore de acessibilidade de uma tela com controles de estado é inspecionada
- **THEN** cada controle aparece com seu papel e seu estado, e não apenas como texto

#### Scenario: Glifo decorativo não vira nome acessível

- **WHEN** um controle usa um caractere ou ícone apenas como indicação visual de estado
- **THEN** esse glifo não aparece no nome acessível do controle, e o estado é anunciado pelo
  atributo de estado
