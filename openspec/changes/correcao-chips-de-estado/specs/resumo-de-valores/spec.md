## MODIFIED Requirements

### Requirement: Contagens de apoio

O resumo SHALL exibir a contagem de itens por estado e a contagem de itens sem preço cadastrado. Toda contagem que usa um rótulo do vocabulário do usuário compartilhado com outra tela SHALL ter exatamente a mesma semântica daquela tela: o chip "Faltando" SHALL contar `critico + emFalta`, como na Despensa, nunca a leitura bruta de um único estado.

#### Scenario: Contagem por estado

- **WHEN** a despensa tem 3 itens zerados, 12 em falta e 50 completos
- **THEN** o resumo exibe as três contagens

#### Scenario: Itens sem preço sinalizados

- **WHEN** existem itens sem valor unitário cadastrado
- **THEN** o resumo informa quantos são, indicando que os valores exibidos são parciais

#### Scenario: Acesso a partir da contagem

- **WHEN** o usuário toca em uma contagem de estado
- **THEN** ele é levado à despensa já filtrada por aquele estado

#### Scenario: "Faltando" idêntico ao da Despensa

- **WHEN** a despensa tem 37 itens zerados (`critico`) e 0 itens parcialmente em falta (`emFalta`)
- **THEN** o chip "Faltando" do Resumo exibe 37 — o mesmo número que o chip "Faltando" da Despensa exibe no mesmo instante

#### Scenario: Semântica consistente após mutação

- **WHEN** uma compra é fechada e itens mudam de estado
- **THEN** os chips "Faltando" do Resumo e da Despensa continuam exibindo o mesmo número entre si
