## MODIFIED Requirements

### Requirement: Quantidade a comprar

O domínio SHALL calcular a quantidade a comprar como a diferença entre a necessária e a atual,
nunca negativa, e SHALL aplicar o arredondamento para cima quando a unidade for indivisível.
Quando o produto tiver fator de conversão de embalagem cadastrado, o arredondamento SHALL ser
para o múltiplo do fator, não para 1 unidade, e o resultado SHALL indicar também o excedente de
unidades que sobrará em estoque após a compra.

#### Scenario: Falta simples em unidade divisível

- **WHEN** a quantidade atual é 500 e a necessária é 2000 na unidade quilograma
- **THEN** a quantidade a comprar é 1500 milésimos

#### Scenario: Falta fracionária em unidade indivisível arredonda para cima

- **WHEN** a quantidade atual é 2500 e a necessária é 3000 na unidade pacote
- **THEN** a quantidade a comprar é 1000 milésimos, ou seja, 1 pacote

#### Scenario: Item ok não gera quantidade a comprar

- **WHEN** a quantidade atual é 5000 e a necessária é 2000
- **THEN** a quantidade a comprar é 0

#### Scenario: Item zerado compra o necessário inteiro

- **WHEN** a quantidade atual é 0 e a necessária é 3000 na unidade unidade
- **THEN** a quantidade a comprar é 3000 milésimos

#### Scenario: Falta menor que um pacote arredonda para o fator

- **WHEN** um produto com fator de conversão 12 tem 6 unidades faltando
- **THEN** a quantidade a comprar é 12 unidades (1 pacote), com excedente de 6 unidades
  sinalizado

#### Scenario: Falta maior que um pacote arredonda para o múltiplo do fator

- **WHEN** um produto com fator de conversão 12 tem 30 unidades faltando
- **THEN** a quantidade a comprar é 36 unidades (3 pacotes), com excedente de 6 unidades
  sinalizado

#### Scenario: Falta exata em múltiplo do fator não gera excedente

- **WHEN** um produto com fator de conversão 12 tem exatamente 12 unidades faltando
- **THEN** a quantidade a comprar é 12 unidades, sem excedente
