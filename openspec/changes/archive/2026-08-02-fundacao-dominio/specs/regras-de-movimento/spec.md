## ADDED Requirements

### Requirement: Tipos de movimento e coerência de sinal

O domínio SHALL definir três tipos de movimento — `baixa`, `reposicao` e `ajuste` — e SHALL garantir que a variação de um movimento de baixa seja negativa, a de uma reposição seja positiva, e a de um ajuste possa ser de qualquer sinal, mas nunca zero.

#### Scenario: Baixa tem variação negativa

- **WHEN** um movimento de baixa de 1 unidade é construído
- **THEN** a variação é -1000 milésimos

#### Scenario: Reposição tem variação positiva

- **WHEN** um movimento de reposição de 2 unidades é construído
- **THEN** a variação é 2000 milésimos

#### Scenario: Variação zero é rejeitada

- **WHEN** um movimento com variação 0 é construído
- **THEN** o resultado é falha, independentemente do tipo

#### Scenario: Sinal incoerente é rejeitado

- **WHEN** um movimento do tipo baixa é construído com variação positiva
- **THEN** o resultado é falha indicando incoerência de sinal

### Requirement: Saldo resultante nunca negativo

O domínio SHALL calcular o saldo resultante de um movimento e SHALL fixá-lo em zero quando a variação levaria o saldo abaixo de zero. A quantidade efetivamente aplicada SHALL ser a que produz esse saldo.

#### Scenario: Baixa dentro do saldo

- **WHEN** o saldo atual é 3000 e a baixa é de 1000
- **THEN** o saldo resultante é 2000 e a variação aplicada é -1000

#### Scenario: Baixa que cruzaria zero fixa em zero

- **WHEN** o saldo atual é 500 e a baixa solicitada é de 2000
- **THEN** o saldo resultante é 0 e a variação aplicada é -500

#### Scenario: Baixa em item já zerado

- **WHEN** o saldo atual é 0 e uma baixa é solicitada
- **THEN** o resultado indica que nenhum movimento deve ser gravado, e o saldo permanece 0

#### Scenario: Reposição soma ao saldo

- **WHEN** o saldo atual é 1000 e a reposição é de 2000
- **THEN** o saldo resultante é 3000

### Requirement: Desfazer produz movimento inverso

Desfazer um movimento SHALL produzir um novo movimento com a variação de sinal oposto. O movimento original NÃO deve ser alterado nem removido — a trilha é append-only.

#### Scenario: Inverso de uma baixa

- **WHEN** uma baixa de variação -1000 é desfeita
- **THEN** o movimento gerado é uma reposição de variação +1000

#### Scenario: Inverso de uma reposição

- **WHEN** uma reposição de variação +2000 é desfeita
- **THEN** o movimento gerado é uma baixa de variação -2000

#### Scenario: Movimento original preservado

- **WHEN** qualquer movimento é desfeito
- **THEN** o movimento original permanece na trilha e o resultado é a adição de um novo movimento

#### Scenario: Inverso de um ajuste mantém o tipo ajuste

- **WHEN** um ajuste de variação +300 é desfeito
- **THEN** o movimento gerado é um ajuste de variação -300
