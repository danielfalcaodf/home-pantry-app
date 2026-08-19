## MODIFIED Requirements

### Requirement: Ordenação e agrupamento por categoria

A lista SHALL ser ordenada por categoria e, dentro dela, por nome, e SHALL oferecer alternar entre a visão agrupada por categoria e a visão em lista contínua. O controle que alterna o agrupamento SHALL ter alvo de toque mínimo de 48×48dp. A lógica de agrupamento (`agruparListaPorCategoria`) e de lista contínua (`listaContinua`, em `src/presentation/format/agrupar-lista.ts`) SHALL ser verificável diretamente com testes unitários, não apenas indiretamente através da exportação de texto (`gerarTextoDaLista`). Itens sem categoria (avulsos e produtos com categoria vazia) SHALL cair no grupo "Sem categoria", e esse grupo SHALL sempre aparecer por último na visão agrupada. A preferência de agrupamento (`usePreferenciaDeAgrupamento`) SHALL persistir via `ConfiguracaoRepository`, verificável com repositório fake.

O controle de agrupamento SHALL expressar seu estado por canais visuais redundantes, e NÃO apenas por `accessibilityState`. Ligado e desligado NÃO SHALL renderizar de forma idêntica. Além disso, o controle SHALL ser visualmente distinguível das ações sem estado que ficam ao lado dele no mesmo cabeçalho: um interruptor e um botão de ação pintados igual não informam qual dos dois tem estado.

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

#### Scenario: Grupo "Sem categoria" é sempre o último

- **WHEN** `agruparListaPorCategoria` recebe itens com e sem categoria
- **THEN** os grupos de categoria aparecem em ordem alfabética e o grupo "Sem categoria" aparece depois de todos eles

#### Scenario: Alternar grava a preferência invertida

- **WHEN** `usePreferenciaDeAgrupamento().alternar()` é chamado
- **THEN** o valor gravado no repositório é o oposto do valor lido na montagem, e o estado exibido reflete a inversão

#### Scenario: Estado do agrupamento é visível sem leitor de tela

- **WHEN** o agrupamento é alternado
- **THEN** a aparência do controle muda de forma perceptível, de modo que capturas dos dois estados não são idênticas

#### Scenario: Interruptor distinguível da ação ao lado

- **WHEN** o cabeçalho da Lista exibe o controle de agrupamento ao lado de ações sem estado
- **THEN** o controle com estado é visualmente distinguível das ações sem estado, e não apenas pelo rótulo
