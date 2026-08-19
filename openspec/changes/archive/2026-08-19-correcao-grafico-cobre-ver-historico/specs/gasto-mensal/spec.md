## ADDED Requirements

### Requirement: Gráfico nunca cobre o controle acima dele

O gráfico de barras de gasto mensal SHALL reservar espaço suficiente para que nenhuma barra,
em nenhuma distribuição de valores entre os meses exibidos, sobreponha visualmente o cabeçalho
"Gasto por mês" / "Ver histórico" acima dele.

#### Scenario: Um único mês com gasto

- **WHEN** apenas um mês do período possui gasto (fração máxima da barra)
- **THEN** o topo dessa barra não toca nem cobre o texto "Ver histórico"

#### Scenario: Mês mais recente disparadamente maior

- **WHEN** o mês mais recente tem gasto muito maior que os demais meses exibidos
- **THEN** a barra desse mês, mesmo próxima da altura máxima do gráfico, mantém clearance visível
  em relação ao cabeçalho acima

#### Scenario: Vários meses com gastos parecidos

- **WHEN** os meses exibidos têm gastos parecidos entre si (nenhuma fração próxima de 1)
- **THEN** o comportamento permanece o mesmo de hoje, sem regressão na leitura proporcional das
  barras
