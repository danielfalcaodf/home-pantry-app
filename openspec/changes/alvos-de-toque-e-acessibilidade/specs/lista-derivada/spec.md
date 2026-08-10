## MODIFIED Requirements

### Requirement: Ordenação e agrupamento por categoria

A lista SHALL ser ordenada por categoria e, dentro dela, por nome, e SHALL oferecer alternar entre a visão agrupada por categoria e a visão em lista contínua. O controle que alterna o agrupamento SHALL ter alvo de toque mínimo de 48×48dp.

#### Scenario: Visão agrupada

- **WHEN** o agrupamento por categoria está ativo
- **THEN** os itens aparecem sob cabeçalhos de categoria, em ordem alfabética dentro de cada grupo

#### Scenario: Visão contínua

- **WHEN** o agrupamento está desativado
- **THEN** os itens aparecem em lista única ordenada por nome

#### Scenario: Preferência de agrupamento mantida

- **WHEN** o usuário alterna o agrupamento e sai da tela
- **THEN** ao voltar, a escolha anterior permanece

#### Scenario: Alvo de toque do controle de agrupamento

- **WHEN** o botão "Agrupar por categoria" do cabeçalho da Lista é medido
- **THEN** sua área tocável mede no mínimo 48 por 48 pontos independentes, sem alterar seu tamanho visual
