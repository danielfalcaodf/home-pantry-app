## MODIFIED Requirements

### Requirement: Componente de texto tipografado

O sistema SHALL fornecer um componente de texto que aceita apenas os papéis tipográficos declarados na escala, e que aplica família, tamanho, altura de linha, peso e espaçamento de acordo com o papel.

#### Scenario: Papel válido resolve a família correta

- **WHEN** o papel de dado é usado
- **THEN** o texto renderiza na família monoespaçada com figuras tabulares

#### Scenario: Papel inválido é rejeitado

- **WHEN** um papel fora da escala é passado
- **THEN** o compilador de tipos rejeita, comprovado por um teste de tipo (`@ts-expect-error` passando um papel fora da escala tipográfica ao componente `Texto`) validado via `tsc --noEmit`

#### Scenario: Números não deslocam o layout

- **WHEN** um número renderizado com o papel de dado muda de 10 para 9
- **THEN** a largura ocupada não muda e nenhum elemento adjacente se desloca
