# tipografia-carregada

## Requirements

### Requirement: Três famílias com papéis não intercambiáveis

O app SHALL carregar três famílias tipográficas com papéis fixos: uma de display para título de tela e a quantidade grande do detalhe, uma de corpo para toda a interface, e uma monoespaçada com figuras tabulares para **todo** número — preço, quantidade, total e data.

#### Scenario: Número usa a família monoespaçada

- **WHEN** qualquer preço, quantidade, total ou data é renderizado
- **THEN** ele usa a família monoespaçada com figuras tabulares

#### Scenario: Display restrito

- **WHEN** a família de display é usada
- **THEN** é apenas em título de tela ou na quantidade grande da tela de detalhe, nunca na lista

#### Scenario: Fontes carregadas antes do primeiro quadro de conteúdo

- **WHEN** o app abre
- **THEN** nenhuma tela de conteúdo renderiza com fonte de sistema antes das famílias carregarem

### Requirement: Apenas os pesos efetivamente usados

O app SHALL carregar somente os pesos tipográficos que a interface realmente usa, e os nomes das constantes SHALL corresponder aos pesos que os pacotes de fonte de fato exportam.

#### Scenario: Pesos verificados antes de fixar constantes

- **WHEN** as constantes de peso são definidas
- **THEN** cada uma corresponde a um peso efetivamente exportado pelo respectivo pacote de fonte

#### Scenario: Peso não usado não é carregado

- **WHEN** a lista de fontes carregadas é inspecionada
- **THEN** ela não contém nenhum peso que a escala tipográfica não referencie

#### Scenario: Orçamento de bundle medido

- **WHEN** o peso total das fontes embarcadas é medido
- **THEN** o valor é registrado, e ultrapassar 400 quilobytes dispara a decisão de remover a família de display

### Requirement: Escala do sistema respeitada

O layout SHALL suportar a escala de fonte do sistema até 200 por cento sem truncar o nome do item.

#### Scenario: Nome cresce sem truncar

- **WHEN** a escala de fonte do sistema está em 200 por cento
- **THEN** a linha do item cresce em altura e o nome permanece integralmente legível

#### Scenario: Alvos de toque preservados na escala máxima

- **WHEN** a escala de fonte está no máximo suportado
- **THEN** os alvos de toque continuam medindo no mínimo 48 por 48 pontos
