## MODIFIED Requirements

### Requirement: Preferência de tema persistida

O usuário SHALL poder escolher entre automático pelo sistema, claro e escuro, com automático como padrão. A escolha SHALL ser persistida no banco local, e NÃO em estado volátil. A persistência SHALL ser feita pelo hook de aplicação (`usePreferenciaDeTemaPersistida`) através de um repositório injetável, permitindo verificar diretamente — com um repositório fake — que gravar a escolha e montar o hook novamente reflete o valor salvo, sem depender apenas da função pura de resolução de tema.

O tema efetivo resolvido por esse hook SHALL governar **todo** o chrome visível do app, não apenas as cores da UI: o conteúdo da barra de status do sistema também SHALL ser derivado dele. Nenhuma parte do chrome SHALL ficar sem dono — deixar o estilo da barra de status indefinido entrega a decisão ao padrão da plataforma ou à heurística do fabricante, e nenhuma parte dele SHALL seguir `useColorScheme()` por conta própria, porque a preferência persistida pode divergir da aparência do sistema.

#### Scenario: Padrão é automático

- **WHEN** o app abre pela primeira vez
- **THEN** o tema segue a preferência de aparência do sistema

#### Scenario: Escolha sobrevive ao fechamento

- **WHEN** o usuário escolhe o tema claro e fecha e reabre o app
- **THEN** o app abre no tema claro, mesmo com o sistema em modo escuro

#### Scenario: Automático acompanha mudança do sistema

- **WHEN** a preferência é automática e o sistema alterna de claro para escuro
- **THEN** o app alterna junto, sem reinício

#### Scenario: Barra de status acompanha o tema escolhido

- **WHEN** o usuário escolhe qualquer um dos temas, divergindo ou não da aparência do sistema
- **THEN** o conteúdo da barra de status muda junto com as cores do app, mantendo contraste
  legível contra o fundo do tema escolhido

### Requirement: Abertura sem flash de tema errado

O tema salvo SHALL ser lido **antes** de a tela de abertura ser escondida. Essa leitura SHALL resolver, no mesmo ponto, tanto as cores da UI quanto o estilo do conteúdo da barra de status — os dois SHALL ser aplicados juntos, para que não exista quadro intermediário com o fundo de um tema e a barra de status do outro.

#### Scenario: Abertura em tema escuro não pisca branco

- **WHEN** o app com preferência escura é aberto
- **THEN** nenhum quadro com fundo claro é exibido entre a tela de abertura e a primeira tela

#### Scenario: Tela de abertura só some após o tema resolvido

- **WHEN** a leitura da preferência ainda não concluiu
- **THEN** a tela de abertura permanece visível

#### Scenario: Barra de status já correta no primeiro quadro

- **WHEN** o app é aberto com preferência de tema divergente da aparência do sistema
- **THEN** o primeiro quadro após a tela de abertura já traz o fundo e o conteúdo da barra de
  status do mesmo tema
