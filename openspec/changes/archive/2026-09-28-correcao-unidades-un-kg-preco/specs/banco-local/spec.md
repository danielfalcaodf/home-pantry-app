## ADDED Requirements

### Requirement: Migration de redução de unidades preserva os dados existentes

A migration que restringe `produto.unidade` a `un`/`kg` SHALL converter, na mesma aplicação e
sem perda de linhas, todos os dados gravados nas unidades removidas:

- `g` → `kg`: `produto.quantidade_atual`, `produto.quantidade_necessaria`,
  `movimento_estoque.quantidade_delta`, `movimento_estoque.quantidade_resultante`,
  `compra_item.quantidade_planejada` e `compra_item.quantidade_comprada` divididos por 1000;
  `produto.valor_unitario` zerado (produto passa a "sem preço"); `compra_item.unidade` = `kg`.
- `pacote`/`caixa` → `un`: quantidades, preços e fator de embalagem mantidos.
- `ml`/`L` → `un`: quantidades arredondadas para cima à unidade inteira, preço zerado.

A reescrita de `movimento_estoque` nesta migration é mudança de escala de medida, não de fato
registrado, e é a única exceção documentada à regra append-only. Depois da migration, a
quantidade materializada de cada produto convertido de `g` SHALL continuar batendo com a soma das
variações dos seus movimentos.

#### Scenario: Produto em gramas vira quilo sem preço

- **WHEN** a migration é aplicada sobre um produto `g` com quantidade atual 500000, necessária
  1000000 e valor unitário 519
- **THEN** o produto fica em `kg` com quantidade atual 500, necessária 1000 e valor unitário 0

#### Scenario: Histórico do produto em gramas acompanha a escala

- **WHEN** o produto `g` convertido tinha um movimento de baixa de -200000 com resultante 500000
- **THEN** o movimento passa a ter variação -200 e resultante 500, e a soma das variações do
  produto é igual à sua quantidade atual

#### Scenario: Pacote e caixa viram unidade sem mudar números

- **WHEN** a migration é aplicada sobre um produto `pacote` com quantidade 3000, preço 1290 e
  fator 12
- **THEN** o produto fica em `un` com quantidade 3000, preço 1290 e fator 12

#### Scenario: Unidade de volume vira unidade arredondada

- **WHEN** a migration é aplicada sobre um produto `L` com quantidade atual 1500 e valor
  unitário 899
- **THEN** o produto fica em `un` com quantidade atual 2000 e valor unitário 0 (saída de
  segurança: não há dados reais em volume no aparelho)

#### Scenario: Unidade removida é recusada pelo schema depois da migration

- **WHEN** uma escrita tenta gravar um produto com unidade `g` depois da migration
- **THEN** o `CHECK` da tabela rejeita a escrita
