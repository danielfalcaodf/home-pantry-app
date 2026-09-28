## MODIFIED Requirements

### Requirement: Fator de conversão opcional restrito a unidade indivisível

O domínio SHALL permitir associar a um produto de unidade indivisível (`un`) um fator de
conversão opcional: um inteiro positivo representando quantas unidades de estoque vêm em um
pacote fechado, e um valor de referência do pacote em centavos. Produto de unidade divisível
(`kg`) NÃO deve aceitar fator de conversão.

#### Scenario: Fator aceito em unidade indivisível

- **WHEN** um produto de unidade `un` recebe fator de conversão 12 e valor do pacote 1290 centavos
- **THEN** o cadastro é aceito e o fator fica associado ao produto

#### Scenario: Fator rejeitado em unidade divisível

- **WHEN** um produto de unidade quilograma recebe uma tentativa de fator de conversão
- **THEN** o domínio rejeita, mantendo o produto sem fator

#### Scenario: Fator é opcional

- **WHEN** um produto de unidade indivisível é cadastrado sem informar fator de conversão
- **THEN** o cadastro é aceito normalmente e o produto se comporta como hoje, sem nenhuma
  conversão

#### Scenario: Fator deve ser inteiro positivo

- **WHEN** um fator de conversão de 0 ou negativo é informado
- **THEN** o domínio rejeita o valor
