## ADDED Requirements

### Requirement: Item de compra registra pacotes e fator usado

Quando um item de compra referenciar um produto com fator de conversão cadastrado, o item SHALL
registrar a quantidade de pacotes comprados e o tamanho de pacote realmente usado naquela
compra (que pode divergir do fator cadastrado no produto), além da quantidade em unidades já
derivada. O valor pago por unidade SHALL ser derivado dividindo o valor total pago pela
quantidade em unidades (pacotes × tamanho de pacote usado).

#### Scenario: Item registra pacotes e fator usado

- **WHEN** um item de compra é marcado com 1 pacote de tamanho 12 por 1290 centavos
- **THEN** o item registra 1 pacote, fator usado 12, quantidade comprada 12 unidades e valor
  pago por unidade de 108 centavos

#### Scenario: Fator usado na compra pode divergir do cadastrado no produto

- **WHEN** o produto está cadastrado com fator 12, mas a compra usa fator 16
- **THEN** o item de compra registra fator usado 16, e o fator cadastrado no produto permanece
  12 após o fechamento

#### Scenario: Item sem fator de conversão não registra pacotes

- **WHEN** o produto do item não tem fator de conversão cadastrado
- **THEN** o item não registra pacotes nem fator usado, seguindo o comportamento existente de
  quantidade e preço por unidade

### Requirement: Preço pago por unidade derivado de pacotes alimenta a divergência de preço existente

Quando o valor pago por unidade for derivado a partir de pacotes, ele SHALL ser comparado ao
valor unitário cadastrado do produto pela mesma regra de detecção de divergência já existente,
sem nenhuma regra adicional específica de embalagem.

#### Scenario: Divergência detectada a partir de preço derivado

- **WHEN** o valor unitário cadastrado do produto é 100 centavos e o valor pago por unidade
  derivado da compra em pacotes é 108 centavos
- **THEN** o domínio sinaliza divergência de preço para aquele item, do mesmo jeito que
  sinalizaria para um item sem fator de conversão

#### Scenario: Sem divergência quando o preço derivado coincide

- **WHEN** o valor unitário cadastrado é igual ao valor pago por unidade derivado
- **THEN** nenhuma divergência é sinalizada
