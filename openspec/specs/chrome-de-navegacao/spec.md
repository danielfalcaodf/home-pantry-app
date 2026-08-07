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
Toda tela alcançada por navegação empilhada (não uma aba) que dependeria do botão de voltar do header nativo SHALL desenhar seu próprio botão "←" dentro do conteúdo, com alvo de toque mínimo de 48×48dp e rótulo acessível "Voltar", chamando a navegação de volta.

#### Scenario: Voltar do Detalhe do produto
- **WHEN** o usuário está na tela de Detalhe do produto e toca no botão "←" desenhado no conteúdo
- **THEN** o app volta para a tela anterior (Despensa)

#### Scenario: Voltar do Cadastrar produto
- **WHEN** o usuário está na tela de Cadastrar produto e toca no botão "←" desenhado no conteúdo
- **THEN** o app volta para a tela anterior (Despensa)

#### Scenario: Voltar do Modo compra
- **WHEN** o usuário está na tela de Modo compra e toca no botão "←" desenhado no conteúdo
- **THEN** o app volta para a tela anterior (Lista)

#### Scenario: Botão de voltar tem alvo de toque acessível
- **WHEN** o botão "←" é renderizado em qualquer tela empilhada
- **THEN** sua área de toque é de no mínimo 48×48dp e possui `accessibilityRole="button"` com rótulo "Voltar"

### Requirement: Tab bar sem ícones
A tab bar (Despensa, Lista, Resumo) SHALL exibir apenas os rótulos de texto de cada aba, sem nenhum ícone — nem um ícone customizado, nem o ícone de aviso padrão do React Navigation (`MissingIcon`).

#### Scenario: Renderizar a tab bar
- **WHEN** qualquer tela dentro do grupo de abas é exibida
- **THEN** a tab bar mostra os rótulos "Despensa", "Lista" e "Resumo" sem nenhum ícone acima ou ao lado do texto, e nenhum ícone de aviso (X dentro de caixa) é renderizado
