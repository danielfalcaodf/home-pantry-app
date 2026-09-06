# conversao-de-embalagem

## Purpose

Definir o fator de conversão opcional de embalagem para produtos de unidade indivisível — o
pacote fechado vendido no mercado (ex.: 12 unidades) como múltiplo da unidade de estoque —
cobrindo cadastro do fator, derivação do valor unitário e da quantidade a comprar, e o preço
pago por unidade apurado no fechamento da compra.

## Requirements

### Requirement: Fator de conversão opcional restrito a unidade indivisível

O domínio SHALL permitir associar a um produto de unidade indivisível (`un`, `pacote`, `caixa`)
um fator de conversão opcional: um inteiro positivo representando quantas unidades de estoque
vêm em um pacote fechado, e um valor de referência do pacote em centavos. Produto de unidade
divisível (`kg`, `g`, `L`, `ml`) NÃO deve aceitar fator de conversão.

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

### Requirement: Rótulo do pacote composto pelo fator

O domínio SHALL compor o rótulo de exibição do pacote a partir apenas do número do fator de
conversão, no formato "Vem em pacotes de N", sem campo de texto livre para nomear a embalagem.

#### Scenario: Rótulo com fator 12

- **WHEN** o fator de conversão de um produto é 12
- **THEN** o rótulo exibido é "Vem em pacotes de 12"

#### Scenario: Produto sem fator não exibe rótulo

- **WHEN** um produto não tem fator de conversão
- **THEN** nenhum rótulo de pacote é exibido

### Requirement: Valor unitário derivado do valor do pacote

Quando um produto tem fator de conversão e valor do pacote cadastrados, o domínio SHALL derivar
o valor unitário de referência (por unidade de estoque) dividindo o valor do pacote pelo fator,
arredondando ao centavo mais próximo. O valor unitário NÃO deve ser digitado diretamente pelo
usuário nesse caso.

#### Scenario: Divisão exata

- **WHEN** o valor do pacote é 1200 centavos e o fator é 12
- **THEN** o valor unitário derivado é 100 centavos

#### Scenario: Divisão com resto arredonda ao centavo mais próximo

- **WHEN** o valor do pacote é 1290 centavos e o fator é 12
- **THEN** o valor unitário derivado é 108 centavos (107,5 arredondado para cima)

### Requirement: Arredondamento da quantidade a comprar para múltiplo do fator

Quando um produto tem fator de conversão cadastrado, o domínio SHALL arredondar a quantidade a
comprar para o múltiplo do fator imediatamente acima da diferença entre necessária e atual, em
vez de arredondar para 1 unidade. O resultado SHALL incluir tanto a quantidade em pacotes quanto
o excedente de unidades que sobrará em estoque após a compra.

#### Scenario: Falta menor que um pacote

- **WHEN** um produto com fator 12 tem 6 unidades faltando
- **THEN** a quantidade a comprar é 1 pacote (12 unidades), com excedente de 6 unidades após a
  compra

#### Scenario: Falta exige mais de um pacote

- **WHEN** um produto com fator 12 tem 30 unidades faltando
- **THEN** a quantidade a comprar é 3 pacotes (36 unidades), com excedente de 6 unidades após a
  compra

#### Scenario: Falta exata em múltiplo do fator

- **WHEN** um produto com fator 12 tem exatamente 12 unidades faltando
- **THEN** a quantidade a comprar é 1 pacote, sem excedente

#### Scenario: Produto sem fator usa a regra existente

- **WHEN** um produto sem fator de conversão tem unidades faltando
- **THEN** a quantidade a comprar segue o arredondamento para 1 unidade já existente, sem
  nenhuma mudança de comportamento

### Requirement: Preço pago por unidade derivado do fator usado na compra

Ao registrar a compra de um produto com fator de conversão, o domínio SHALL aceitar a
quantidade de pacotes comprados, o tamanho real do pacote encontrado (que pode divergir do
fator cadastrado no produto) e o valor total pago, e SHALL derivar o preço pago por unidade
dividindo o total pelo total de unidades (pacotes × tamanho real do pacote).

#### Scenario: Tamanho do pacote igual ao cadastrado

- **WHEN** o usuário compra 1 pacote de tamanho real 12 (igual ao cadastrado) por 1290 centavos
- **THEN** o preço pago por unidade derivado é 108 centavos e a quantidade repositada é 12
  unidades

#### Scenario: Tamanho do pacote diferente do cadastrado no mercado

- **WHEN** o produto está cadastrado com fator 12, mas o usuário informa que o pacote encontrado
  tem 16 unidades, compra 1 pacote por 1600 centavos
- **THEN** o preço pago por unidade derivado usa 16 (não 12), resultando em 100 centavos por
  unidade, e a quantidade repositada é 16 unidades

#### Scenario: Divergência de tamanho não altera o cadastro do produto

- **WHEN** uma compra usa tamanho de pacote diferente do fator cadastrado no produto
- **THEN** o fator de conversão cadastrado no produto permanece inalterado após o fechamento da
  compra

#### Scenario: Preço pago por unidade alimenta a revisão de preço existente

- **WHEN** o preço pago por unidade derivado diverge do valor unitário atual do produto
- **THEN** o item entra na revisão agrupada de divergência de preço já existente no fechamento
  da compra, sem nenhuma tela ou pergunta adicional específica de embalagem
