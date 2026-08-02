## MODIFIED Requirements

### Requirement: Sem animação durante a rolagem

O nível SHALL ser pintado diretamente no valor final ao renderizar. A tinta NÃO deve animar durante a rolagem nem na entrada dos itens na tela. A tinta SHALL animar **exclusivamente** quando a quantidade daquele item mudar por ação do usuário.

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
