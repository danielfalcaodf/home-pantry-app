## MODIFIED Requirements

### Requirement: Apenas os pesos efetivamente usados

O app SHALL carregar somente os pesos tipográficos que a interface realmente usa, e os nomes das constantes SHALL corresponder aos pesos que os pacotes de fonte de fato exportam.

#### Scenario: Pesos verificados antes de fixar constantes

- **WHEN** as constantes de peso são definidas
- **THEN** cada uma corresponde a um peso efetivamente exportado pelo respectivo pacote de fonte

#### Scenario: Peso não usado não é carregado

- **WHEN** a lista de fontes carregadas é inspecionada
- **THEN** ela não contém nenhum peso que a escala tipográfica não referencie

#### Scenario: Orçamento de bundle medido automaticamente

- **WHEN** um script/teste automatizado soma o tamanho dos arquivos de fonte resolvidos pelos pacotes `@expo-google-fonts/*` efetivamente carregados
- **THEN** o valor medido é registrado e comparado ao limiar de 400 quilobytes citado neste requisito — substituindo o comentário manual como única fonte da medição — e o script/teste falha se o peso ultrapassar o limite rígido de regressão acordado em `design.md`, impedindo que o orçamento cresça mais sem que ninguém perceba
