## ADDED Requirements

### Requirement: Classificação do estado do item

O domínio SHALL classificar cada produto em exatamente um de três estados: **crítico** quando a quantidade atual é zero, **em falta** quando a quantidade atual é maior que zero e menor que a necessária, e **ok** quando a quantidade atual é maior ou igual à necessária.

#### Scenario: Item zerado é crítico

- **WHEN** a quantidade atual é 0 e a necessária é 3000
- **THEN** o estado é crítico

#### Scenario: Item abaixo do mínimo está em falta

- **WHEN** a quantidade atual é 2000 e a necessária é 3000
- **THEN** o estado é em falta

#### Scenario: Item no mínimo exato está ok

- **WHEN** a quantidade atual é 3000 e a necessária é 3000
- **THEN** o estado é ok

#### Scenario: Item acima do mínimo está ok

- **WHEN** a quantidade atual é 5000 e a necessária é 2000
- **THEN** o estado é ok

### Requirement: Quantidade a comprar

O domínio SHALL calcular a quantidade a comprar como a diferença entre a necessária e a atual, nunca negativa, e SHALL aplicar o arredondamento para cima quando a unidade for indivisível.

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

### Requirement: Custo de reposição e valor em estoque

O domínio SHALL calcular o custo de reposição de um item como a quantidade a comprar multiplicada pelo valor unitário, e o valor em estoque como a quantidade atual multiplicada pelo valor unitário, ambos em centavos e ambos usando a conversão única de milésimos por centavos.

#### Scenario: Custo de reposição com preço cadastrado

- **WHEN** a quantidade a comprar é 2000 milésimos e o valor unitário é 890 centavos
- **THEN** o custo de reposição é 1780 centavos

#### Scenario: Item sem preço não corrompe o cálculo

- **WHEN** o valor unitário é 0
- **THEN** o custo de reposição é 0 e o item é sinalizado como sem preço

#### Scenario: Valor em estoque

- **WHEN** a quantidade atual é 3000 milésimos e o valor unitário é 1290 centavos
- **THEN** o valor em estoque é 3870 centavos

#### Scenario: Total de uma lista ignora ausência de preço sem quebrar

- **WHEN** uma lista contém itens com preço e itens sem preço
- **THEN** o total é a soma apenas dos custos calculáveis, e a contagem de itens sem preço é retornada separadamente

### Requirement: Fração do medidor clampada entre zero e um

O domínio SHALL calcular a fração de preenchimento do medidor visual como a razão entre a quantidade atual e a necessária, **sempre limitada ao intervalo de 0 a 1**. A camada de apresentação NÃO deve calcular nem limitar essa fração.

#### Scenario: Fração parcial

- **WHEN** a quantidade atual é 2000 e a necessária é 3000
- **THEN** a fração é aproximadamente 0,667

#### Scenario: Item acima do necessário não transborda

- **WHEN** a quantidade atual é 5000 e a necessária é 2000
- **THEN** a fração é exatamente 1, e o item é sinalizado como tendo sobra

#### Scenario: Item zerado não tem preenchimento

- **WHEN** a quantidade atual é 0
- **THEN** a fração é exatamente 0

#### Scenario: Quantidade necessária inválida não produz divisão indefinida

- **WHEN** a quantidade necessária é 0
- **THEN** a fração retornada é 0 e nenhuma exceção é lançada

### Requirement: Rótulo textual redundante ao estado

O domínio SHALL produzir o rótulo textual do item, de forma que o estado seja legível sem depender de cor: "Acabou" para crítico, "Falta N" para em falta, e "Cheio" para ok.

#### Scenario: Rótulo de item zerado

- **WHEN** o estado é crítico
- **THEN** o rótulo é "Acabou"

#### Scenario: Rótulo de item em falta indica quanto falta

- **WHEN** a quantidade atual é 2000 e a necessária é 3000 na unidade pacote
- **THEN** o rótulo é "Falta 1"

#### Scenario: Rótulo de item completo

- **WHEN** o estado é ok
- **THEN** o rótulo é "Cheio"

#### Scenario: Rótulo nunca usa vocabulário de sistema

- **WHEN** qualquer rótulo é gerado
- **THEN** ele NÃO contém os termos "dar baixa", "movimento de estoque" ou "reposição"

### Requirement: Normalização de categoria na escrita

O domínio SHALL normalizar o texto de categoria antes de qualquer persistência: remover espaços nas pontas, colapsar espaços internos repetidos e capitalizar a primeira letra. O texto cru digitado pelo usuário NÃO deve ser gravado.

#### Scenario: Espaços nas pontas removidos

- **WHEN** a categoria digitada é " Limpeza "
- **THEN** a categoria normalizada é "Limpeza"

#### Scenario: Caixa normalizada

- **WHEN** a categoria digitada é "limpeza"
- **THEN** a categoria normalizada é "Limpeza"

#### Scenario: Espaços internos colapsados

- **WHEN** a categoria digitada é "Produtos  de   limpeza"
- **THEN** a categoria normalizada é "Produtos de limpeza"

#### Scenario: Categoria vazia vira ausência de categoria

- **WHEN** a categoria digitada contém apenas espaços
- **THEN** a categoria normalizada é ausente, e não uma string vazia

### Requirement: Validação de cadastro de produto

O domínio SHALL validar o cadastro de produto retornando um `Result`, exigindo nome não vazio, unidade dentro do conjunto suportado e quantidade necessária maior que zero. Quantidade atual e valor unitário são opcionais e assumem zero.

#### Scenario: Cadastro válido

- **WHEN** nome, unidade e quantidade necessária maior que zero são fornecidos
- **THEN** o resultado é sucesso e contém o produto validado com quantidade atual 0 e valor unitário 0 por padrão

#### Scenario: Nome vazio é rejeitado

- **WHEN** o nome fornecido contém apenas espaços
- **THEN** o resultado é falha com erro identificando o campo nome

#### Scenario: Quantidade necessária zero é rejeitada

- **WHEN** a quantidade necessária fornecida é 0
- **THEN** o resultado é falha com erro identificando a quantidade necessária

#### Scenario: Quantidade necessária aceita decimal

- **WHEN** a quantidade necessária fornecida é 1,5 na unidade quilograma
- **THEN** o resultado é sucesso e a quantidade necessária armazenada é 1500 milésimos

#### Scenario: Valor unitário negativo é rejeitado

- **WHEN** o valor unitário fornecido é negativo
- **THEN** o resultado é falha com erro identificando o valor unitário
