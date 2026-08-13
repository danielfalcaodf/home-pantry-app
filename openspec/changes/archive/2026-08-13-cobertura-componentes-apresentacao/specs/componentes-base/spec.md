## MODIFIED Requirements

### Requirement: Toast que não bloqueia e não empilha

O sistema SHALL fornecer um componente de toast ancorado acima da barra de abas, com duração e barra de tempo visível, com ação opcional. Um novo toast SHALL substituir o anterior, e toasts NÃO devem se acumular. O mecanismo de substituição SHALL ser verificável diretamente: disparar um segundo toast com o primeiro ainda visível deixa exatamente um toast na árvore de componentes.

#### Scenario: Substituição em vez de empilhamento

- **WHEN** um segundo toast é disparado com o primeiro ainda visível
- **THEN** o primeiro é substituído e apenas um toast está na tela

#### Scenario: Não bloqueia interação

- **WHEN** um toast está visível
- **THEN** o usuário pode continuar interagindo com a tela por trás

#### Scenario: Tempo restante é visível

- **WHEN** um toast com ação é exibido
- **THEN** uma barra fina indica o tempo restante até ele desaparecer

### Requirement: Movimento respeita a preferência de acessibilidade

Animações SHALL respeitar a preferência de redução de movimento do sistema automaticamente. Quando ela estiver ativa, transições de valor SHALL ocorrer em corte seco com esmaecimento curto (`withTiming` com a duração de `DURACAO_FADE`, nunca `withSpring`), e o retorno tátil SHALL permanecer.

#### Scenario: Redução de movimento ativa

- **WHEN** a preferência de redução de movimento do sistema está ligada e um valor animado muda
- **THEN** a mudança ocorre em esmaecimento curto, sem física de mola

#### Scenario: Retorno tátil preservado

- **WHEN** a redução de movimento está ligada e uma ação com retorno tátil é executada
- **THEN** o retorno tátil ainda acontece

#### Scenario: Preferência lida pelo sistema, não por sinalizador manual

- **WHEN** uma animação de mola é declarada
- **THEN** ela declara respeito à preferência do sistema, sem checagem manual espalhada nos componentes
