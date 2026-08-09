## Purpose

Define o comportamento do chrome de navegação do Expo Router (header nativo e tab bar) em todas as rotas do app — quando o header nativo fica oculto, quais telas desenham o próprio botão de voltar e a ausência de ícones na tab bar.

## Requirements

### Requirement: Header nativo oculto em toda rota
O app SHALL manter o header nativo do Expo Router oculto (`headerShown: false`) em todas as rotas, sem exceção, já que toda tela desenha o próprio título dentro do conteúdo.

#### Scenario: Abrir a aba Despensa
- **WHEN** o usuário abre a aba Despensa
- **THEN** nenhum header nativo com o texto `(tabs)` ou qualquer outro nome de segmento de rota é exibido

#### Scenario: Abrir o Detalhe do produto
- **WHEN** o usuário toca em um item da despensa e a tela de Detalhe do produto abre
- **THEN** nenhum header nativo com o texto `produto/[id]` ou qualquer outro nome de segmento de rota é exibido

#### Scenario: Abrir o Cadastrar produto
- **WHEN** o usuário toca em "Cadastrar do zero" e a tela de Cadastrar produto abre
- **THEN** nenhum header nativo com o texto `novo` ou qualquer outro nome de segmento de rota é exibido

#### Scenario: Abrir o Modo compra
- **WHEN** o usuário inicia uma compra e a tela de Modo compra abre
- **THEN** nenhum header nativo com o texto `[id]` ou qualquer outro nome de segmento de rota é exibido

### Requirement: Botão de voltar desenhado no conteúdo em telas empilhadas
Toda tela alcançada por navegação empilhada (não uma aba) que dependeria do botão de voltar do header nativo SHALL desenhar seu próprio botão "←" dentro do conteúdo, com alvo de toque mínimo de 48×48dp e rótulo acessível "Voltar", chamando a navegação de volta. Isso inclui Detalhe do produto, Cadastrar produto, Modo compra, Conferência de estoque, Diagnóstico, Lista básica, Histórico de compras (lista e detalhe) e Histórico do produto. A aba Configurações também desenha o botão, ainda que como aba não dependa do header nativo — mantém o padrão visual consistente com as demais telas de configuração/diagnóstico.

#### Scenario: Voltar do Detalhe do produto
- **WHEN** o usuário está na tela de Detalhe do produto e toca no botão "←" desenhado no conteúdo
- **THEN** o app volta para a tela anterior (Despensa)

#### Scenario: Voltar do Cadastrar produto
- **WHEN** o usuário está na tela de Cadastrar produto e toca no botão "←" desenhado no conteúdo
- **THEN** o app volta para a tela anterior (Despensa)

#### Scenario: Voltar do Modo compra
- **WHEN** o usuário está na tela de Modo compra e toca no botão "←" desenhado no conteúdo
- **THEN** o app volta para a tela anterior (Lista)

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

#### Scenario: Botão de voltar tem alvo de toque acessível
- **WHEN** o botão "←" é renderizado em qualquer tela empilhada
- **THEN** sua área de toque é de no mínimo 48×48dp e possui `accessibilityRole="button"` com rótulo "Voltar"

### Requirement: Tab bar com ícone por aba
A tab bar (Despensa, Lista, Resumo, Configurações) SHALL exibir um ícone SVG por aba, ao lado do rótulo de texto, desenhado com `react-native-svg` a partir dos paths do design system (a aba Configurações usa um ícone próprio, sem equivalente no design system) — nunca o ícone de aviso padrão do React Navigation (`MissingIcon`). A cor do ícone SHALL seguir a mesma resolução de cor do rótulo (`action.azulejo` na aba ativa, `text.secondary` nas inativas). A tela de Configurações é uma aba (antes era alcançada só por link a partir do Resumo).

#### Scenario: Renderizar a tab bar
- **WHEN** qualquer tela dentro do grupo de abas é exibida
- **THEN** a tab bar mostra os rótulos "Despensa", "Lista", "Resumo" e "Configurações", cada um com um ícone SVG próprio, e nenhum ícone de aviso (X dentro de caixa) é renderizado

#### Scenario: Cor do ícone segue a aba ativa
- **WHEN** o usuário troca de aba
- **THEN** o ícone da aba recém-ativada usa a cor `action.azulejo` e os ícones das demais abas usam `text.secondary`
