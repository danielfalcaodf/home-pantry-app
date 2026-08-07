## MODIFIED Requirements

### Requirement: Tab bar com ícone por aba

A tab bar (Despensa, Lista, Resumo) SHALL exibir um ícone SVG por aba, ao lado do rótulo de texto, desenhado com `react-native-svg` a partir dos paths do design system — nunca o ícone de aviso padrão do React Navigation (`MissingIcon`). A cor do ícone SHALL seguir a mesma resolução de cor do rótulo (`action.azulejo` na aba ativa, `text.secondary` nas inativas).

#### Scenario: Renderizar a tab bar
- **WHEN** qualquer tela dentro do grupo de abas é exibida
- **THEN** a tab bar mostra os rótulos "Despensa", "Lista" e "Resumo", cada um com um ícone SVG próprio, e nenhum ícone de aviso (X dentro de caixa) é renderizado

#### Scenario: Cor do ícone segue a aba ativa
- **WHEN** o usuário troca de aba
- **THEN** o ícone da aba recém-ativada usa a cor `action.azulejo` e os ícones das demais abas usam `text.secondary`
