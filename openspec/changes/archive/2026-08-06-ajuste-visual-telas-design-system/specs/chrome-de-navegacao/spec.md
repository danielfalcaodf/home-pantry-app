## MODIFIED Requirements

### Requirement: Tab bar com ícone por aba

A tab bar (Despensa, Lista, Resumo, Configurações) SHALL exibir um ícone SVG por aba, ao lado do rótulo de texto, desenhado com `react-native-svg` a partir dos paths do design system (a aba Configurações usa um ícone próprio, sem equivalente no design system) — nunca o ícone de aviso padrão do React Navigation (`MissingIcon`). A cor do ícone SHALL seguir a mesma resolução de cor do rótulo (`action.azulejo` na aba ativa, `text.secondary` nas inativas). A tela de Configurações passa a ser uma aba (antes era alcançada só por link a partir do Resumo).

#### Scenario: Renderizar a tab bar
- **WHEN** qualquer tela dentro do grupo de abas é exibida
- **THEN** a tab bar mostra os rótulos "Despensa", "Lista", "Resumo" e "Configurações", cada um com um ícone SVG próprio, e nenhum ícone de aviso (X dentro de caixa) é renderizado

#### Scenario: Cor do ícone segue a aba ativa
- **WHEN** o usuário troca de aba
- **THEN** o ícone da aba recém-ativada usa a cor `action.azulejo` e os ícones das demais abas usam `text.secondary`

### Requirement: Botão de voltar desenhado no conteúdo em telas empilhadas

Toda tela alcançada por navegação empilhada (não uma aba) que dependeria do botão de voltar do header nativo SHALL desenhar seu próprio botão "←" dentro do conteúdo, com alvo de toque mínimo de 48×48dp e rótulo acessível "Voltar", chamando a navegação de volta. Isso inclui, além das telas já cobertas por `correcao-navegacao-nativa` (Detalhe do produto, Cadastrar produto, Modo compra): Conferência de estoque, Diagnóstico, Lista básica, Histórico de compras (lista e detalhe) e Histórico do produto. A aba Configurações também desenha o botão, ainda que como aba não dependa de header nativo — pedido explícito para manter o padrão visual consistente com as demais telas de configuração/diagnóstico.

#### Scenario: Voltar da Conferência de estoque
- **WHEN** o usuário está na tela "O que você quer conferir?" e toca no botão "←"
- **THEN** o app volta para a tela anterior

#### Scenario: Voltar do Diagnóstico
- **WHEN** o usuário está na tela Diagnóstico e toca no botão "←"
- **THEN** o app volta para a tela anterior (Configurações)

#### Scenario: Voltar da Lista básica
- **WHEN** o usuário está em "O básico de uma casa" e toca no botão "←"
- **THEN** o app volta para a tela anterior (Despensa)

#### Scenario: Voltar do Histórico de compras
- **WHEN** o usuário está na lista ou no detalhe do Histórico de compras e toca no botão "←"
- **THEN** o app volta para a tela anterior

#### Scenario: Voltar do Histórico do produto
- **WHEN** o usuário está no Histórico de um produto e toca no botão "←"
- **THEN** o app volta para o Detalhe do produto
