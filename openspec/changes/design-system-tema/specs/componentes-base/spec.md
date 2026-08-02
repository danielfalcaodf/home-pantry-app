## ADDED Requirements

### Requirement: Componente de texto tipografado

O sistema SHALL fornecer um componente de texto que aceita apenas os papéis tipográficos declarados na escala, e que aplica família, tamanho, altura de linha, peso e espaçamento de acordo com o papel.

#### Scenario: Papel válido resolve a família correta

- **WHEN** o papel de dado é usado
- **THEN** o texto renderiza na família monoespaçada com figuras tabulares

#### Scenario: Papel inválido é rejeitado

- **WHEN** um papel fora da escala é passado
- **THEN** o compilador de tipos rejeita

#### Scenario: Números não deslocam o layout

- **WHEN** um número renderizado com o papel de dado muda de 10 para 9
- **THEN** a largura ocupada não muda e nenhum elemento adjacente se desloca

### Requirement: Botão com alvo de toque mínimo

O sistema SHALL fornecer um componente de botão cuja área tocável tem no mínimo 48 por 48 pontos independentes, e que expressa os estados normal, pressionado e desabilitado.

#### Scenario: Alvo mínimo respeitado

- **WHEN** um botão visualmente menor que 48 pontos é renderizado
- **THEN** sua área tocável ainda mede no mínimo 48 por 48

#### Scenario: Estado desabilitado é perceptível sem cor

- **WHEN** o botão está desabilitado
- **THEN** ele é anunciado como desabilitado ao leitor de tela, além da mudança visual

### Requirement: Campo de texto com rótulo persistente

O componente de campo SHALL exibir o rótulo **sempre acima** do campo. Texto de exemplo NÃO deve ser usado como rótulo.

#### Scenario: Rótulo permanece durante a digitação

- **WHEN** o usuário digita no campo
- **THEN** o rótulo continua visível acima

#### Scenario: Foco é indicado

- **WHEN** o campo recebe foco
- **THEN** seu divisor inferior passa a 2 pontos na cor de ação

#### Scenario: Erro é descrito em texto

- **WHEN** o campo está em erro
- **THEN** a mensagem de erro é exibida em texto, e não apenas por cor

### Requirement: Chip de estado com contagem

O sistema SHALL fornecer um componente de chip usado para filtrar, exibindo rótulo e contagem, com estado ativo distinguível.

#### Scenario: Chip ativo é distinguível

- **WHEN** um chip está ativo
- **THEN** ele recebe fundo na cor do estado com opacidade reduzida e texto na cor cheia

#### Scenario: Contagem faz parte do rótulo acessível

- **WHEN** o leitor de tela anuncia o chip
- **THEN** ele inclui o rótulo e a contagem

### Requirement: Toast que não bloqueia e não empilha

O sistema SHALL fornecer um componente de toast ancorado acima da barra de abas, com duração e barra de tempo visível, com ação opcional. Um novo toast SHALL substituir o anterior, e toasts NÃO devem se acumular.

#### Scenario: Substituição em vez de empilhamento

- **WHEN** um segundo toast é disparado com o primeiro ainda visível
- **THEN** o primeiro é substituído e apenas um toast está na tela

#### Scenario: Não bloqueia interação

- **WHEN** um toast está visível
- **THEN** o usuário pode continuar interagindo com a tela por trás

#### Scenario: Tempo restante é visível

- **WHEN** um toast com ação é exibido
- **THEN** uma barra fina indica o tempo restante até ele desaparecer

### Requirement: Estado vazio como convite

O sistema SHALL fornecer um componente de estado vazio composto por texto de convite e uma ação sugerida. Textos de estado vazio NÃO devem ser avisos secos.

#### Scenario: Estado vazio oferece caminho

- **WHEN** um estado vazio é exibido
- **THEN** ele apresenta um texto de convite e um botão com a próxima ação concreta

#### Scenario: Vocabulário de interface

- **WHEN** qualquer texto de estado vazio é exibido
- **THEN** ele NÃO usa termos de sistema como "dar baixa", "movimento de estoque" ou "reposição"

### Requirement: Tela de erro acionável

O sistema SHALL fornecer uma tela de erro que declara o que aconteceu e o que fazer, sem pedir desculpas.

#### Scenario: Erro oferece ação

- **WHEN** uma tela de erro é exibida
- **THEN** ela contém uma ação de recuperação, como tentar novamente

#### Scenario: Falha de migration usa a tela de erro

- **WHEN** a aplicação de migrations falha na abertura
- **THEN** a tela de erro é exibida e o app não prossegue para a interface normal

### Requirement: Movimento respeita a preferência de acessibilidade

Animações SHALL respeitar a preferência de redução de movimento do sistema automaticamente. Quando ela estiver ativa, transições de valor SHALL ocorrer em corte seco com esmaecimento curto, e o retorno tátil SHALL permanecer.

#### Scenario: Redução de movimento ativa

- **WHEN** a preferência de redução de movimento do sistema está ligada e um valor animado muda
- **THEN** a mudança ocorre em esmaecimento curto, sem física de mola

#### Scenario: Retorno tátil preservado

- **WHEN** a redução de movimento está ligada e uma ação com retorno tátil é executada
- **THEN** o retorno tátil ainda acontece

#### Scenario: Preferência lida pelo sistema, não por sinalizador manual

- **WHEN** uma animação de mola é declarada
- **THEN** ela declara respeito à preferência do sistema, sem checagem manual espalhada nos componentes
