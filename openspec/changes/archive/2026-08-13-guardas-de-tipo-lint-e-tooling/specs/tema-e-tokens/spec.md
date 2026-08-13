## MODIFIED Requirements

### Requirement: Duas paletas irmãs completas

O sistema SHALL fornecer dois temas de primeira classe — escuro e claro — com a **mesma forma** de tokens, e NÃO um derivado por inversão do outro. Ambos SHALL declarar fundo base, superfície, elevado, divisor, texto primário, texto secundário, as três cores de estado, a cor de ação e a opacidade de preenchimento do medidor.

#### Scenario: Mesma forma nos dois temas

- **WHEN** os dois temas são comparados
- **THEN** eles expõem exatamente o mesmo conjunto de chaves de token

#### Scenario: Opacidade de preenchimento distinta por tema

- **WHEN** a opacidade de preenchimento é lida
- **THEN** o tema escuro retorna 0,12 e o tema claro retorna 0,10

#### Scenario: Contraste mínimo atendido

- **WHEN** qualquer par de cor de texto sobre seu fundo declarado é medido
- **THEN** a razão de contraste atende no mínimo o nível AA

#### Scenario: Tema tipado

- **WHEN** um componente acessa um token inexistente
- **THEN** o compilador de tipos rejeita o acesso, comprovado por um teste de tipo (`@ts-expect-error` acessando uma chave de token inexistente em `Theme`) validado via `tsc --noEmit`

### Requirement: Escala de espaço, raio e tipografia

O sistema SHALL fornecer tokens fechados de espaçamento, raio e tipografia. Valores arbitrários NÃO devem ser usados diretamente em componentes, e a conformidade com a escala fechada de espaçamento SHALL ser verificada por um mecanismo executável (regra de lint dedicada ou teste de conformidade por varredura de `src/presentation/components/`), não apenas por revisão de código.

#### Scenario: Espaçamento restrito à escala

- **WHEN** um componente aplica espaçamento
- **THEN** o valor vem da escala de 4, 8, 12, 16, 24, 32 e 48

#### Scenario: Valor de espaçamento fora da escala é rejeitado

- **WHEN** um arquivo em `src/presentation/components/` usa um valor numérico literal de espaçamento (ex. `padding`, `margin`, `gap`) fora da escala fechada
- **THEN** o mecanismo de verificação (lint ou teste de conformidade) acusa a violação, sem falsos positivos para propriedades numéricas legítimas que não são espaçamento (ex. `flex`, `fontSize`, `opacity`)

#### Scenario: Raio zero na linha da lista

- **WHEN** a linha de item da despensa é estilizada
- **THEN** seu raio é 0, indo de borda a borda

#### Scenario: Papéis tipográficos fixos

- **WHEN** o token tipográfico de um número é usado
- **THEN** ele resolve para a família monoespaçada com figuras tabulares

#### Scenario: Limite de tamanho

- **WHEN** qualquer token tipográfico é inspecionado
- **THEN** nenhum tamanho excede 34 pontos
