## MODIFIED Requirements

### Requirement: Filtro por estado com contagem

A despensa SHALL exibir chips de filtro por estado — `Tudo`, `Acabou` (itens críticos) e `Faltando` (itens críticos e itens abaixo do mínimo, somados) —, cada um com a contagem de itens que ele cobre, e SHALL filtrar a lista ao chip ativo. Não há chip dedicado a itens completos (`Cheio`); esses itens continuam visíveis no chip `Tudo`.

A contagem exibida SHALL refletir o conjunto efetivamente considerado pela tela naquele momento. Quando há busca ativa, o universo de contagem passa a ser o resultado da busca, e NÃO o total da despensa. Chip anunciando 40 enquanto a lista mostra o estado vazio é contradição entre dois elementos da mesma tela.

#### Scenario: Contagens refletem a despensa

- **WHEN** a despensa tem 3 itens zerados e 12 abaixo do mínimo
- **THEN** o chip `Acabou` exibe 3 e o chip `Faltando` exibe 15 (3 críticos + 12 em falta)

#### Scenario: Filtro "Acabou" aplicado

- **WHEN** o chip `Acabou` é ativado
- **THEN** apenas os itens no estado crítico permanecem na lista

#### Scenario: Filtro "Faltando" aplicado

- **WHEN** o chip `Faltando` é ativado
- **THEN** os itens em estado crítico e os itens em falta permanecem na lista, e os itens completos (`Cheio`) somem

#### Scenario: Contagem atualiza após mudança de quantidade

- **WHEN** a quantidade de um item muda e ele troca de estado
- **THEN** as contagens dos chips `Acabou` e `Faltando` são atualizadas sem recarregar a tela

#### Scenario: Chip sem itens

- **WHEN** nenhum item está no estado crítico nem em falta
- **THEN** os chips `Acabou` e `Faltando` exibem contagem zero e permanecem acionáveis

#### Scenario: Contagem acompanha a busca ativa

- **WHEN** há um termo de busca ativo que reduz o conjunto exibido
- **THEN** as contagens dos chips passam a contar apenas os itens que casam com a busca

#### Scenario: Busca sem resultado zera as contagens

- **WHEN** a busca não encontra nenhum item e o estado vazio é exibido
- **THEN** os chips exibem contagem zero, sem contradizer a lista vazia

### Requirement: Busca por nome

A despensa SHALL permitir buscar itens por nome, ignorando diferença de caixa e acentuação. A normalização SHALL ser feita por uma função pura (`normalizarParaBusca`/`casaComBusca`, em `src/presentation/format/normalizar-busca.ts`), diretamente testável e independente do `COLLATE NOCASE` do SQLite (que é ASCII-only e não resolve acento).

O campo de busca NÃO SHALL aplicar correção ortográfica nem sublinhado de verificação de escrita: nome de produto não é texto de prosa, e marcar "Açúcar" ou uma marca comercial como erro é ruído.

O estado vazio da busca SHALL permanecer inteiramente visível com o teclado aberto, incluindo sua ação de cadastrar o termo buscado. O posicionamento SHALL descontar a altura do teclado, e NÃO centralizar o bloco na região da lista como se o teclado não existisse — a folga não pode encolher conforme o termo digitado cresce.

Quando a lista fica vazia sem nenhum termo buscado — porque um filtro de estado ou de categoria não tem itens correspondentes —, o estado vazio exibido NÃO SHALL citar um termo de busca nem oferecer uma ação de cadastro com nome vazio. O texto e a ação SHALL refletir a causa real: filtro sem itens, não busca sem resultado.

#### Scenario: Busca parcial

- **WHEN** o usuário digita parte do nome de um item
- **THEN** a lista mostra os itens cujo nome contém o trecho digitado

#### Scenario: Busca ignora acento e caixa

- **WHEN** o usuário busca por "acucar"
- **THEN** um item chamado "Açúcar" é encontrado

#### Scenario: Busca sem resultado oferece cadastro

- **WHEN** a busca não encontra nenhum item
- **THEN** é exibida a mensagem de nenhum item com esse nome e uma ação para cadastrar o termo buscado

#### Scenario: Campo de busca sem corretor ortográfico

- **WHEN** o usuário digita um nome de produto no campo de busca
- **THEN** nenhum sublinhado de verificação ortográfica é exibido e nenhuma correção automática é aplicada ao que foi digitado

#### Scenario: Estado vazio não encosta no teclado

- **WHEN** a busca não encontra nada e o teclado está aberto
- **THEN** a mensagem e a ação de cadastrar ficam inteiramente acima do teclado, com folga que não diminui conforme o termo buscado cresce

#### Scenario: Vazio por filtro sem termo buscado não cita busca

- **WHEN** um filtro de estado ou categoria deixa a lista vazia e nenhum termo foi digitado no campo de busca
- **THEN** o texto do estado vazio não cita nenhum termo entre aspas, e a ação exibida não tenta cadastrar um produto sem nome
