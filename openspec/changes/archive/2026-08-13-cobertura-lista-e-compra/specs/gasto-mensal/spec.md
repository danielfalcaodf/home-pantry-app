## MODIFIED Requirements

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
