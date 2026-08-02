# unidades-e-valores

## Requirements

### Requirement: Quantidade representada em milésimos inteiros

Toda quantidade SHALL ser representada como inteiro em milésimos da unidade. `1,5 kg` é `1500`. Ponto flutuante NÃO deve ser usado para armazenar ou somar quantidade.

#### Scenario: Conversão de decimal para milésimos

- **WHEN** a quantidade digitada pelo usuário é 1,5
- **THEN** o valor de domínio resultante é 1500

#### Scenario: Conversão de milésimos para exibição

- **WHEN** um valor de domínio 1500 é formatado para exibição na unidade quilograma
- **THEN** o texto resultante é "1,5 kg"

#### Scenario: Quantidade inteira não exibe casas decimais supérfluas

- **WHEN** um valor de domínio 2000 é formatado para exibição na unidade unidade
- **THEN** o texto resultante é "2 un" e não "2,000 un"

#### Scenario: Somatório exato

- **WHEN** os valores 100, 200 e 300 milésimos são somados
- **THEN** o resultado é exatamente 600, sem erro de arredondamento

### Requirement: Classificação de unidade divisível e indivisível

O domínio SHALL classificar `un`, `pacote` e `caixa` como indivisíveis, e `kg`, `g`, `L`, `ml` como divisíveis.

#### Scenario: Unidade indivisível

- **WHEN** a unidade consultada é pacote
- **THEN** ela é classificada como indivisível

#### Scenario: Unidade divisível

- **WHEN** a unidade consultada é quilograma
- **THEN** ela é classificada como divisível

#### Scenario: Conjunto fechado de unidades

- **WHEN** um valor fora das sete unidades suportadas é usado
- **THEN** o compilador de tipos rejeita o valor

### Requirement: Arredondamento para cima em unidade indivisível

Quando a quantidade calculada a comprar recair em unidade indivisível, o domínio SHALL arredondar para cima até a próxima unidade inteira. Em unidade divisível, o valor SHALL ser preservado em milésimos.

#### Scenario: Meio pacote vira um pacote

- **WHEN** a quantidade calculada é 500 milésimos na unidade pacote
- **THEN** a quantidade a comprar é 1000 milésimos, ou seja, 1 pacote

#### Scenario: Uma unidade e um pouco vira duas unidades

- **WHEN** a quantidade calculada é 1200 milésimos na unidade unidade
- **THEN** a quantidade a comprar é 2000 milésimos

#### Scenario: Unidade divisível preserva a fração

- **WHEN** a quantidade calculada é 500 milésimos na unidade quilograma
- **THEN** a quantidade a comprar permanece 500 milésimos, ou seja, 0,5 kg

#### Scenario: Valor já inteiro não é inflado

- **WHEN** a quantidade calculada é 2000 milésimos na unidade caixa
- **THEN** a quantidade a comprar permanece 2000 milésimos

### Requirement: Dinheiro representado em centavos inteiros

Todo valor monetário SHALL ser representado como inteiro em centavos. `R$ 12,90` é `1290`. Ponto flutuante NÃO deve ser usado para dinheiro.

#### Scenario: Formatação em real brasileiro

- **WHEN** o valor de domínio 1290 é formatado para exibição
- **THEN** o texto resultante é "R$ 12,90"

#### Scenario: Valor zero é formatado explicitamente

- **WHEN** o valor de domínio 0 é formatado para exibição
- **THEN** o texto resultante é "R$ 0,00"

#### Scenario: Conversão de texto digitado

- **WHEN** o usuário digita "12,90" em um campo de preço
- **THEN** o valor de domínio resultante é 1290

### Requirement: Conversão única de milésimos por centavos

Multiplicar uma quantidade em milésimos por um preço em centavos produz centavos multiplicados por mil. O domínio SHALL expor uma **única** função que faz essa conversão de volta para centavos, e nenhuma tela ou consulta SHALL replicar essa aritmética.

#### Scenario: Produto de quantidade por preço

- **WHEN** a quantidade 2000 milésimos é multiplicada pelo preço 1290 centavos
- **THEN** o valor resultante é 2580 centavos, ou seja, R$ 25,80

#### Scenario: Quantidade fracionária

- **WHEN** a quantidade 500 milésimos é multiplicada pelo preço 1000 centavos
- **THEN** o valor resultante é 500 centavos, ou seja, R$ 5,00

#### Scenario: Arredondamento do resultado em centavos

- **WHEN** a multiplicação produz uma fração de centavo
- **THEN** o resultado é arredondado para o centavo mais próximo e o resultado é um inteiro
