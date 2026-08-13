## ADDED Requirements

### Requirement: Mini gráfico dos últimos meses

O Resumo SHALL exibir um mini gráfico de barras com exatamente os 4 meses mais recentes de gasto, em ordem cronológica ascendente (mês mais antigo à esquerda, mais recente à direita), alimentado pelos mesmos dados agregados que a seção "Gasto por mês".

#### Scenario: Exatamente 4 meses no gráfico

- **WHEN** existem gastos agregados em mais de 4 meses
- **THEN** o mini gráfico exibe exatamente os 4 meses mais recentes, e nenhum mês mais antigo aparece nele

#### Scenario: Ordem cronológica ascendente no gráfico

- **WHEN** o mini gráfico é exibido
- **THEN** os meses aparecem da esquerda para a direita do mais antigo dos 4 para o mais recente — ordem inversa à da lista "Gasto por mês" (que é do mais recente para o mais antigo)

#### Scenario: Menos de 4 meses com dado

- **WHEN** existem gastos agregados em menos de 4 meses
- **THEN** o mini gráfico exibe apenas os meses existentes, na mesma ordem cronológica ascendente
