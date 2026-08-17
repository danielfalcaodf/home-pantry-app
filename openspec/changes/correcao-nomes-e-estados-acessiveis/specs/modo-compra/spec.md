## MODIFIED Requirements

### Requirement: Marcação item a item

Cada item SHALL ter um controle de marcação quadrado com alvo de toque adequado ao uso com uma mão. Ao ser marcado, o item SHALL indicar visualmente que já foi pego.

O estado marcado/desmarcado SHALL ser anunciável ao leitor de tela: a linha SHALL expor papel de caixa de seleção e estado de marcação na árvore de acessibilidade da plataforma. O visto (`✓`) é indicação visual e NÃO SHALL ser o canal por onde o estado chega ao leitor de tela — um glifo concatenado ao nome não é estado.

#### Scenario: Item marcado muda de aparência

- **WHEN** um item é marcado
- **THEN** seu nome passa à cor secundária com risco horizontal e a linha perde todo o preenchimento

#### Scenario: Desmarcar reverte

- **WHEN** um item marcado é desmarcado
- **THEN** ele volta à aparência anterior e sai do total corrente

#### Scenario: Alvo de toque adequado

- **WHEN** o controle de marcação é medido
- **THEN** sua área tocável tem no mínimo 48 por 48 pontos independentes

#### Scenario: Controle quadrado, não circular

- **WHEN** o controle de marcação é renderizado
- **THEN** ele é quadrado, indicando ação de riscar uma lista

#### Scenario: Estado da marcação presente na árvore de acessibilidade

- **WHEN** a árvore de acessibilidade da tela de compra é inspecionada
- **THEN** cada linha aparece com papel de caixa de seleção e com seu estado de marcação, e não apenas como texto

#### Scenario: Marcar altera o estado anunciado

- **WHEN** o usuário marca um item
- **THEN** o estado de marcação daquela linha muda na árvore de acessibilidade, sem depender do caractere de visto para comunicar a mudança
