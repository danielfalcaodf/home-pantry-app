## MODIFIED Requirements

### Requirement: Sem animação durante a rolagem

O nível SHALL ser pintado diretamente no valor final ao renderizar. A tinta NÃO deve animar durante a rolagem nem na entrada dos itens na tela. A tinta SHALL animar **exclusivamente** quando a quantidade daquele item mudar por ação do usuário. Esse controle SHALL ser explícito na prop `animar` de `MedidorNivel`: com `animar={false}` o nível assume o valor final diretamente; com `animar={true}` o nível usa física de mola (`molar()`).

Quando a linha é renderizada por uma lista com reciclagem de views (`FlashList`), o componente SHALL distinguir "a quantidade do mesmo item mudou" de "a célula foi reciclada para exibir um item diferente" a partir da identidade do item, e NÃO SHALL animar no segundo caso — mesmo que `fracao` mude entre uma renderização e outra da mesma instância de componente.

#### Scenario: Rolagem não anima níveis

- **WHEN** o usuário rola a lista
- **THEN** os níveis aparecem já no valor final, sem transição

#### Scenario: Sem entrada em cascata

- **WHEN** a tela da despensa é aberta
- **THEN** os itens aparecem simultaneamente, sem animação escalonada e sem esqueleto de carregamento

#### Scenario: Mudança de quantidade anima

- **WHEN** o usuário registra um consumo em um item
- **THEN** o nível daquele item desce até o novo valor com física de mola

#### Scenario: Apenas o item alterado anima

- **WHEN** o usuário registra um consumo em um item
- **THEN** nenhum outro item da lista anima seu nível

#### Scenario: Reordenação após mudança de estado não anima o nível

- **WHEN** um item muda de estado e sua posição na lista muda
- **THEN** seu nível é pintado no valor final na nova posição, sem animar por causa da reordenação

#### Scenario: Prop `animar` controla o mecanismo diretamente

- **WHEN** `MedidorNivel` é renderizado com `animar={false}` e depois com `animar={true}` para a mesma mudança de fração
- **THEN** o primeiro caso salta direto ao valor final e o segundo passa pela mola, sem exceção

#### Scenario: Célula reciclada para item diferente não anima

- **WHEN** a `FlashList` da Despensa recicla a view de um item para exibir um item diferente com uma fração distinta, durante a rolagem
- **THEN** a linha d'água aparece já no valor do novo item, sem transição visível de mola — mesmo que a instância do componente não tenha sido desmontada

#### Scenario: Item real muda de quantidade enquanto outros são reciclados ao lado

- **WHEN** o usuário registra consumo num item visível ao mesmo tempo em que a rolagem recicla células vizinhas para itens diferentes
- **THEN** apenas o item cuja quantidade mudou de fato anima com mola; as células recicladas ao lado aparecem direto no valor final
