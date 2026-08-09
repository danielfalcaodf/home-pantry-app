# movimento-do-gesto

## Purpose

Definir a coreografia de animação do gesto de registrar consumo — a única animação orquestrada do app — para que ela comunique o registro sem competir com o caminho crítico nem atrasar a persistência.

## Requirements

### Requirement: Coreografia do gesto de registrar

Ao registrar um consumo, o app SHALL executar, nesta ordem: retorno tátil leve imediato; contração do círculo do botão para 0,92 e retorno, em cerca de 90 milissegundos; descida do nível até o novo valor com física de mola de amortecimento 18, em cerca de 320 milissegundos; troca dos números em esmaecimento cruzado curto, sem deslizamento; e entrada da confirmação deslizando de baixo, por volta de 120 milissegundos.

#### Scenario: Retorno tátil imediato

- **WHEN** o botão de consumo é tocado
- **THEN** o retorno tátil leve ocorre no instante do toque, antes de qualquer animação concluir

#### Scenario: Nível desce com física de mola

- **WHEN** a quantidade é reduzida
- **THEN** o nível desce até o novo valor com física de mola, e não em transição linear

#### Scenario: Números trocam sem deslizar

- **WHEN** a leitura de quantidade muda
- **THEN** os números trocam em esmaecimento cruzado, sem deslizamento e sem contagem progressiva

#### Scenario: Nenhum elemento adjacente se desloca

- **WHEN** a quantidade muda de dez para nove
- **THEN** nenhum elemento da linha se desloca horizontalmente

### Requirement: Animação na thread de interface

A animação do nível SHALL rodar na thread de interface, de modo a não engasgar durante a rolagem da lista.

#### Scenario: Animação durante rolagem

- **WHEN** o usuário registra um consumo e rola a lista simultaneamente
- **THEN** nem a rolagem nem a animação do nível apresentam engasgo

#### Scenario: Sem trabalho de animação na thread de JavaScript

- **WHEN** a implementação da animação de nível é inspecionada
- **THEN** ela usa valores animados executados na thread de interface

### Requirement: Nada mais anima

A coreografia SHALL existir **apenas** no gesto de alterar a quantidade. Entrada de tela, aparecimento de itens em cascata, esqueleto cintilante e contagem progressiva de números NÃO devem existir.

#### Scenario: Abertura de tela sem animação

- **WHEN** qualquer tela do app é aberta
- **THEN** ela aparece sem animação de entrada encadeada e sem esqueleto de carregamento

#### Scenario: Rolagem não anima níveis

- **WHEN** o usuário rola a lista sem alterar nenhuma quantidade
- **THEN** nenhum nível anima

#### Scenario: Números não contam progressivamente

- **WHEN** um total é atualizado
- **THEN** ele troca diretamente para o novo valor, sem contagem intermediária

### Requirement: Redução de movimento respeitada

Com a preferência de redução de movimento do sistema ativa, a mudança de nível SHALL ocorrer em corte seco com esmaecimento de cerca de 100 milissegundos, e o retorno tátil SHALL permanecer.

#### Scenario: Corte seco com redução ativa

- **WHEN** a redução de movimento está ligada e um consumo é registrado
- **THEN** o nível muda em esmaecimento curto, sem física de mola

#### Scenario: Retorno tátil preservado

- **WHEN** a redução de movimento está ligada
- **THEN** o retorno tátil do toque continua acontecendo

#### Scenario: Informação nunca depende do movimento

- **WHEN** todas as animações estão suprimidas
- **THEN** o estado do item permanece integralmente legível pela altura, pela régua e pelo rótulo

### Requirement: A animação não atrasa a persistência

A gravação SHALL ocorrer independentemente do término das animações. A interface NÃO deve esperar a animação para persistir.

#### Scenario: Gravação não espera animação

- **WHEN** um consumo é registrado
- **THEN** a persistência ocorre imediatamente, sem aguardar o fim da coreografia

#### Scenario: Saída da tela durante a animação

- **WHEN** o usuário navega para outra tela antes de a animação terminar
- **THEN** o registro permanece gravado e nenhum erro ocorre
