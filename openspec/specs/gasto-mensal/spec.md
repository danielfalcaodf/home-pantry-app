# gasto-mensal

## Requirements

### Requirement: Gasto agregado por mês

O app SHALL exibir o total gasto por mês, agregando as compras finalizadas dos últimos doze meses.

#### Scenario: Agregação mensal

- **WHEN** existem três compras finalizadas no mesmo mês
- **THEN** o mês exibe a soma dos totais pagos das três

#### Scenario: Meses ordenados do mais recente

- **WHEN** o gasto mensal é exibido
- **THEN** os meses aparecem do mais recente para o mais antigo

#### Scenario: Quantidade de compras por mês

- **WHEN** um mês é exibido
- **THEN** ele informa quantas compras foram fechadas naquele mês

#### Scenario: Mês sem compra

- **WHEN** um mês do período não teve nenhuma compra finalizada
- **THEN** ele aparece com gasto zero, ou é omitido de forma consistente

### Requirement: Apenas compras finalizadas entram no gasto

O gasto mensal SHALL considerar exclusivamente compras finalizadas. Compras abertas e canceladas NÃO devem contribuir para o gasto mensal. O caso de compra finalizada sem itens marcados (total pago zero) SHALL ter cobertura de teste dedicada em `gastoPorMes` (`src/infrastructure/repositories/sqlite-compra.repository.ts`) e em `useGastoMensal`, não apenas decorrer implicitamente da forma do SQL.

#### Scenario: Compra aberta ignorada

- **WHEN** existe uma compra aberta com itens marcados
- **THEN** ela não aparece no gasto mensal

#### Scenario: Compra cancelada ignorada

- **WHEN** existe uma compra cancelada
- **THEN** ela não contribui para o gasto de nenhum mês

#### Scenario: Compra finalizada com total zero

- **WHEN** uma compra foi finalizada sem itens marcados
- **THEN** ela conta na quantidade de compras do mês e contribui com zero ao total

#### Scenario: Total zero não distorce o total pago do mês

- **WHEN** uma compra com `totalPago` zero é finalizada no mesmo mês de outras compras com valor
- **THEN** `qtdCompras` do mês inclui essa compra, e `totalPago` do mês reflete apenas a soma das compras com valor, sem alteração causada pela compra zerada

### Requirement: Agrupamento por fuso horário local

O agrupamento por mês SHALL usar o fuso horário local do aparelho, de modo que uma compra fechada perto da virada do mês caia no mês em que o usuário a fez.

#### Scenario: Compra próxima à virada do mês

- **WHEN** uma compra é fechada no último dia do mês, no fim da noite, no horário local
- **THEN** ela é agregada naquele mês, e não no seguinte

### Requirement: Estado vazio do gasto mensal

Quando não houver nenhuma compra finalizada, o app SHALL informar isso de forma afirmativa, sem exibir um gráfico ou tabela vazia.

#### Scenario: Nenhuma compra ainda

- **WHEN** nenhuma compra foi finalizada
- **THEN** a seção de gasto informa que ainda não há compras fechadas

#### Scenario: Uma única compra

- **WHEN** existe apenas uma compra finalizada
- **THEN** o gasto daquele mês é exibido normalmente, sem exigir histórico mínimo
