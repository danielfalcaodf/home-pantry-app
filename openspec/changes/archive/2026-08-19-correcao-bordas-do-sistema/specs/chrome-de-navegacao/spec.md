## MODIFIED Requirements

### Requirement: Tab bar com ícone por aba
A tab bar (Despensa, Lista, Resumo, Configurações) SHALL exibir um ícone SVG por aba, ao lado do rótulo de texto, desenhado com `react-native-svg` a partir dos paths do design system (a aba Configurações usa um ícone próprio, sem equivalente no design system) — nunca o ícone de aviso padrão do React Navigation (`MissingIcon`). A cor do ícone SHALL seguir a mesma resolução de cor do rótulo (`action.azulejo` na aba ativa, `text.secondary` nas inativas). A tela de Configurações é uma aba (antes era alcançada só por link a partir do Resumo).

A tab bar SHALL respeitar o inset inferior do sistema: o ícone, o rótulo e o alvo de toque de cada aba SHALL ficar inteiramente acima da faixa reservada à navegação por gestos, e a área da tab bar SHALL se estender por baixo dessa faixa apenas como fundo. Sem isso, os rótulos caem dentro da região em que o sistema captura o swipe de baixo para cima, e cada troca de aba disputa o gesto com o Android.

#### Scenario: Renderizar a tab bar
- **WHEN** qualquer tela dentro do grupo de abas é exibida
- **THEN** a tab bar mostra os rótulos "Despensa", "Lista", "Resumo" e "Configurações", cada um com um ícone SVG próprio, e nenhum ícone de aviso (X dentro de caixa) é renderizado

#### Scenario: Cor do ícone segue a aba ativa
- **WHEN** o usuário troca de aba
- **THEN** o ícone da aba recém-ativada usa a cor `action.azulejo` e os ícones das demais abas usam `text.secondary`

#### Scenario: Rótulos e alvos de toque fora da faixa de gestos
- **WHEN** a tab bar é exibida num aparelho com navegação por gestos
- **THEN** a borda inferior do alvo de toque de cada aba termina acima do início da faixa de gestos, e apenas o fundo da tab bar ocupa a faixa
