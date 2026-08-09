# tema-e-tokens

## Requirements

### Requirement: Duas paletas irmãs completas

O sistema SHALL fornecer dois temas de primeira classe — escuro e claro — com a **mesma forma** de tokens, e NÃO um derivado por inversão do outro. Ambos SHALL declarar fundo base, superfície, elevado, divisor, texto primário, texto secundário, as três cores de estado, a cor de ação e a opacidade de preenchimento do medidor.

#### Scenario: Mesma forma nos dois temas

- **WHEN** os dois temas são comparados
- **THEN** eles expõem exatamente o mesmo conjunto de chaves de token

#### Scenario: Opacidade de preenchimento distinta por tema

- **WHEN** a opacidade de preenchimento é lida
- **THEN** o tema escuro retorna 0,12 e o tema claro retorna 0,10

#### Scenario: Contraste mínimo atendido

- **WHEN** qualquer par de cor de texto sobre seu fundo declarado é medido
- **THEN** a razão de contraste atende no mínimo o nível AA

#### Scenario: Tema tipado

- **WHEN** um componente acessa um token inexistente
- **THEN** o compilador de tipos rejeita o acesso

### Requirement: Nenhuma cor fora dos tokens

Valores de cor SHALL existir exclusivamente no arquivo de tokens. Componentes e estilos NÃO devem conter literais de cor.

#### Scenario: Componente usa token

- **WHEN** um componente precisa de uma cor
- **THEN** ele a obtém do tema corrente, e não de um literal

#### Scenario: Literal em componente é erro de lint

- **WHEN** um literal hexadecimal de cor é escrito em um componente
- **THEN** o linter acusa erro

### Requirement: Escala de espaço, raio e tipografia

O sistema SHALL fornecer tokens fechados de espaçamento, raio e tipografia. Valores arbitrários NÃO devem ser usados diretamente em componentes.

#### Scenario: Espaçamento restrito à escala

- **WHEN** um componente aplica espaçamento
- **THEN** o valor vem da escala de 4, 8, 12, 16, 24, 32 e 48

#### Scenario: Raio zero na linha da lista

- **WHEN** a linha de item da despensa é estilizada
- **THEN** seu raio é 0, indo de borda a borda

#### Scenario: Papéis tipográficos fixos

- **WHEN** o token tipográfico de um número é usado
- **THEN** ele resolve para a família monoespaçada com figuras tabulares

#### Scenario: Limite de tamanho

- **WHEN** qualquer token tipográfico é inspecionado
- **THEN** nenhum tamanho excede 34 pontos

### Requirement: Preferência de tema persistida

O usuário SHALL poder escolher entre automático pelo sistema, claro e escuro, com automático como padrão. A escolha SHALL ser persistida no banco local, e NÃO em estado volátil.

#### Scenario: Padrão é automático

- **WHEN** o app abre pela primeira vez
- **THEN** o tema segue a preferência de aparência do sistema

#### Scenario: Escolha sobrevive ao fechamento

- **WHEN** o usuário escolhe o tema claro e fecha e reabre o app
- **THEN** o app abre no tema claro, mesmo com o sistema em modo escuro

#### Scenario: Automático acompanha mudança do sistema

- **WHEN** a preferência é automática e o sistema alterna de claro para escuro
- **THEN** o app alterna junto, sem reinício

### Requirement: Abertura sem flash de tema errado

O tema salvo SHALL ser lido **antes** de a tela de abertura ser escondida.

#### Scenario: Abertura em tema escuro não pisca branco

- **WHEN** o app com preferência escura é aberto
- **THEN** nenhum quadro com fundo claro é exibido entre a tela de abertura e a primeira tela

#### Scenario: Tela de abertura só some após o tema resolvido

- **WHEN** a leitura da preferência ainda não concluiu
- **THEN** a tela de abertura permanece visível
