## MODIFIED Requirements

### Requirement: Botão de voltar desenhado no conteúdo em telas empilhadas

Toda tela alcançada por navegação empilhada (não uma aba) que dependeria do botão de voltar do header nativo SHALL desenhar seu próprio botão "←" dentro do conteúdo, com alvo de toque mínimo de 48×48dp e rótulo acessível "Voltar", chamando a navegação de volta. Isso inclui Detalhe do produto, Cadastrar produto, Modo compra, Conferência de estoque, Diagnóstico, Lista básica, Histórico de compras (lista e detalhe) e Histórico do produto. A aba Configurações também desenha o botão, ainda que como aba não dependa do header nativo — mantém o padrão visual consistente com as demais telas de configuração/diagnóstico.

Além do inset do sistema (barra de status/faixa de gestos, cobertos por `bordas-do-sistema`), o wrapper do botão de voltar SHALL ter um respiro mínimo próprio no topo — não apenas o menor token de espaçamento da escala. O respiro SHALL ser perceptivelmente maior que o espaçamento entre elementos internos comuns da tela, para que o cabeçalho não pareça colado à borda superior mesmo com o inset já aplicado.

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

#### Scenario: Respiro do cabeçalho além do inset do sistema
- **WHEN** o botão "←" é renderizado numa tela empilhada, já com o inset de sistema aplicado
- **THEN** o espaço entre o topo da área segura e o botão é maior que o menor token de espaçamento da escala — o cabeçalho não fica visualmente colado à borda
