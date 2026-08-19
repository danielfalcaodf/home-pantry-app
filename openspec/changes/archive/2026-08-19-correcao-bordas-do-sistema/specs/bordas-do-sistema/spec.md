## ADDED Requirements

### Requirement: Insets do sistema respeitados em toda tela

Toda tela SHALL desenhar seu conteúdo dentro da área livre do sistema operacional. Cada tela
SHALL consumir os insets do sistema (via `SafeAreaView` ou `useSafeAreaInsets()`) nas bordas
que desenha por conta própria.

Os insets SHALL ser lidos do `SafeAreaProvider` já montado na raiz da árvore pelo roteador.
Nenhum `SafeAreaProvider` adicional SHALL ser montado abaixo dele: um provider aninhado mede
em relação ao próprio layout, e não à janela, o que zera os insets silenciosamente.

Nenhum elemento de conteúdo — texto, ícone ou alvo de toque — SHALL ocupar a faixa da barra de
status no topo nem a faixa reservada à navegação por gestos na base. Num aparelho 1080×2400 a
420dpi (density 2.625) isso significa que nenhum nó de conteúdo pode ter `top` menor que a
altura da barra de status (63px) nem `bottom` maior que o início da faixa de gestos (y=2274,
isto é, 48dp = 126px a partir da base).

O inset SHALL ser lido do sistema em tempo de execução, nunca fixado como constante — a altura
varia por aparelho, por modo de navegação (gestos ou três botões) e por orientação.

#### Scenario: Header próprio não invade a barra de status

- **WHEN** uma tela que desenha o próprio cabeçalho no conteúdo é exibida
- **THEN** o topo do primeiro elemento do cabeçalho fica abaixo do fim da barra de status, sem
  sobreposição com o relógio nem com os ícones do sistema

#### Scenario: Ação primária não cai na faixa de gestos

- **WHEN** uma tela exibe seu botão de ação principal junto à borda inferior
- **THEN** a borda inferior do botão termina acima do início da faixa de gestos, e o swipe de
  baixo para cima continua sendo entregue ao sistema sem competir com o botão

#### Scenario: Inset acompanha a rotação

- **WHEN** o aparelho gira de retrato para paisagem
- **THEN** o conteúdo é redesenhado com os insets da nova orientação, sem margem fixa
  remanescente da orientação anterior

### Requirement: Conteúdo da barra de status segue o tema efetivo do app

O app SHALL declarar explicitamente o estilo do conteúdo da barra de status. Não declarar não
é uma opção neutra: sem declaração, o valor é decidido pelo padrão da plataforma ou por
heurística de auto-contraste do fabricante, e o resultado varia de aparelho para aparelho.

O estilo declarado SHALL ser derivado do **tema efetivo do app** — o mesmo valor que alimenta
os tokens de cor — e NÃO de `useColorScheme()`, NÃO da chave `userInterfaceStyle` do
`app.json`, e NÃO do modo `auto` da biblioteca de barra de status, que também resolve pela
aparência do sistema. O app persiste a preferência de tema no banco local e a aplica por conta
própria; qualquer estilo derivado da aparência do sistema erra sempre que as duas divergem.

O estilo SHALL ser aplicado no mesmo ponto em que o tema salvo é lido antes de a tela de
abertura ser escondida. O valor vigente **antes** do primeiro render SHALL ser declarado no
tema nativo do app, para que não exista quadro de abertura com a barra em desacordo com o
fundo.

#### Scenario: Contraste no tema claro, qualquer aparência do sistema

- **WHEN** o app está no tema Claro (Porcelana), com o sistema em modo claro ou escuro
- **THEN** o conteúdo da barra de status é escuro, e relógio e ícones do sistema permanecem
  legíveis sobre o fundo do tema

#### Scenario: Contraste no tema escuro, qualquer aparência do sistema

- **WHEN** o app está no tema Escuro (Despensa), com o sistema em modo claro ou escuro
- **THEN** o conteúdo da barra de status é claro, e relógio e ícones do sistema permanecem
  legíveis sobre o fundo do tema

#### Scenario: Trocar o tema no app muda a barra na hora

- **WHEN** o usuário troca a preferência de tema na tela de configurações
- **THEN** o conteúdo da barra de status muda junto com as cores do app, sem reinício e sem
  depender de a aparência do sistema ter mudado

#### Scenario: Preferência automática acompanha o sistema

- **WHEN** a preferência é automática e o sistema alterna de claro para escuro
- **THEN** o conteúdo da barra de status alterna junto com as cores do app, sem reinício

#### Scenario: Sem quadro com a combinação errada na abertura

- **WHEN** o app é aberto com uma preferência de tema divergente da do sistema
- **THEN** nenhum quadro é exibido com o fundo de um tema e o conteúdo da barra de status do
  outro

#### Scenario: Resultado não depende do fabricante do aparelho

- **WHEN** o app é aberto num aparelho sem auto-contraste de barra de status
- **THEN** o conteúdo da barra é o mesmo que num aparelho que aplica auto-contraste, porque
  vem de declaração do app e não do padrão da plataforma
