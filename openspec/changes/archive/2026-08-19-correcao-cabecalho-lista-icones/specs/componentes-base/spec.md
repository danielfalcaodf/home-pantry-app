## ADDED Requirements

### Requirement: Ação de cabeçalho pode ser ícone com rótulo acessível preservado

Uma ação secundária de cabeçalho de tela SHALL poder ser apresentada como ícone (em vez de
texto) sem perder o rótulo acessível — o texto que descreve a ação SHALL continuar disponível
via `accessibilityLabel`, mesmo quando não é exibido visualmente.

#### Scenario: Ícone de ação preserva o rótulo para leitor de tela

- **WHEN** uma ação de cabeçalho é apresentada como ícone
- **THEN** o nó correspondente na árvore de acessibilidade expõe o texto completo da ação como
  `accessibilityLabel`

#### Scenario: Ícone de ação mantém alvo de toque mínimo

- **WHEN** uma ação de cabeçalho é apresentada como ícone
- **THEN** o alvo de toque mede pelo menos 48×48dp, igual ao exigido para qualquer controle
  tocável do app
