## MODIFIED Requirements

### Requirement: Classificação de unidade divisível e indivisível

O domínio SHALL suportar exatamente duas unidades: `un` (indivisível) e `kg` (divisível). As
unidades `g`, `L`, `ml`, `pacote` e `caixa` NÃO fazem parte do conjunto suportado.

#### Scenario: Unidade indivisível

- **WHEN** a unidade consultada é `un`
- **THEN** ela é classificada como indivisível

#### Scenario: Unidade divisível

- **WHEN** a unidade consultada é quilograma
- **THEN** ela é classificada como divisível

#### Scenario: Conjunto fechado de unidades

- **WHEN** um valor fora das duas unidades suportadas é usado (inclusive `'g'`, `'pacote'` ou
  uma string arbitrária como `'tonelada'`)
- **THEN** o compilador de tipos rejeita o valor, comprovado por um teste de tipo
  (`@ts-expect-error` atribuindo a string a uma variável tipada `Unidade`) validado via
  `tsc --noEmit`, e não apenas pela forma do tipo literal derivado de `UNIDADES as const`

### Requirement: Arredondamento para cima em unidade indivisível

Quando a quantidade calculada a comprar recair em unidade indivisível, o domínio SHALL arredondar para cima até a próxima unidade inteira. Em unidade divisível, o valor SHALL ser preservado em milésimos.

#### Scenario: Meia unidade vira uma unidade

- **WHEN** a quantidade calculada é 500 milésimos na unidade `un`
- **THEN** a quantidade a comprar é 1000 milésimos, ou seja, 1 un

#### Scenario: Uma unidade e um pouco vira duas unidades

- **WHEN** a quantidade calculada é 1200 milésimos na unidade unidade
- **THEN** a quantidade a comprar é 2000 milésimos

#### Scenario: Unidade divisível preserva a fração

- **WHEN** a quantidade calculada é 500 milésimos na unidade quilograma
- **THEN** a quantidade a comprar permanece 500 milésimos, ou seja, 0,5 kg

#### Scenario: Valor já inteiro não é inflado

- **WHEN** a quantidade calculada é 2000 milésimos na unidade `un`
- **THEN** a quantidade a comprar permanece 2000 milésimos

## ADDED Requirements

### Requirement: Preço de produto em quilo digitado por kg ou por 100 g

O preço de um produto na unidade `kg` SHALL ser sempre gravado em centavos por quilo. Todo campo
onde o usuário digita o preço de referência ou o preço pago de um produto em `kg` (formulário de
produto, sheet de preço da Lista, ajuste do item no Modo Compra) SHALL oferecer a escolha da
base "por kg" (padrão) ou "por 100 g". Com "por 100 g", o domínio SHALL multiplicar o valor
digitado por 10 antes de gravar — conversão feita por uma função pura do domínio, nunca inline
na tela. O preço exibido de um produto em `kg` SHALL trazer o sufixo da base (`R$ 51,90/kg`).
Produtos em `un` NÃO exibem a escolha de base.

#### Scenario: Preço digitado por kg

- **WHEN** o usuário digita "51,90" com a base "por kg" num produto em `kg`
- **THEN** o valor gravado é 5190 centavos por quilo

#### Scenario: Preço digitado por 100 g

- **WHEN** o usuário digita "5,19" com a base "por 100 g" num produto em `kg`
- **THEN** o valor gravado é 5190 centavos por quilo

#### Scenario: Custo de meio quilo não é multiplicado por grama (bug original)

- **WHEN** um queijo em `kg` tem 500 milésimos a comprar e preço de 5190 centavos por quilo
- **THEN** o custo estimado é 2595 centavos, ou seja, R$ 25,95 (e não R$ 2.595,00)

#### Scenario: Exibição com sufixo da base

- **WHEN** o preço de referência de um produto em `kg` é 5190 centavos
- **THEN** o texto exibido é "R$ 51,90/kg"

#### Scenario: Produto em unidade não oferece base

- **WHEN** o campo de preço é exibido para um produto em `un`
- **THEN** a escolha "por kg · por 100 g" não aparece
