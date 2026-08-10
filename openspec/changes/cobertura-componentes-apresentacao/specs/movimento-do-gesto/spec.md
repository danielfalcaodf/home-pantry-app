## MODIFIED Requirements

### Requirement: Coreografia do gesto de registrar

Ao registrar um consumo, o app SHALL executar, nesta ordem: retorno tátil leve imediato (`Haptics.impactAsync`, disparado no toque, antes de qualquer animação concluir e antes do callback de registro retornar); contração do círculo do botão para 0,92 e retorno, em cerca de 90 milissegundos; descida do nível até o novo valor com física de mola de amortecimento 18, em cerca de 320 milissegundos; troca dos números em esmaecimento cruzado curto, sem deslizamento; e entrada da confirmação deslizando de baixo, por volta de 120 milissegundos.

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

#### Scenario: Retorno tátil é uma chamada verificável

- **WHEN** o usuário toca o botão de consumo
- **THEN** `Haptics.impactAsync` é chamado, e essa chamada precede a resolução do callback de registro
