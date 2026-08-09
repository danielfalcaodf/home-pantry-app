## ADDED Requirements

### Requirement: Iniciar compra converte a lista em itens planejados

A lista de compras SHALL oferecer a ação de iniciar a compra, que materializa seus itens correntes como itens planejados da compra aberta. A materialização acontece **apenas** nesse momento — a lista continua sendo derivada até então.

#### Scenario: Materialização no início da compra

- **WHEN** o usuário inicia a compra
- **THEN** os itens da lista corrente passam a existir como itens planejados da compra aberta

#### Scenario: Lista permanece derivada antes disso

- **WHEN** o usuário apenas visualiza a lista sem iniciar a compra
- **THEN** nenhum item planejado é criado

#### Scenario: Quantidade planejada preserva o arredondamento

- **WHEN** um item em unidade indivisível é materializado
- **THEN** sua quantidade planejada é exatamente a exibida na lista, sem novo arredondamento

#### Scenario: Preço estimado registrado no item

- **WHEN** um item com preço é materializado
- **THEN** seu valor estimado por unidade é registrado, permitindo comparar depois com o valor pago

#### Scenario: Avulsos já pertencem à compra

- **WHEN** a lista contém itens avulsos
- **THEN** eles já estão na compra aberta e não são duplicados na materialização

#### Scenario: Alterações do estoque após iniciar não mudam a compra

- **WHEN** o usuário inicia a compra e depois registra um consumo em outro item
- **THEN** os itens planejados da compra em andamento permanecem como estavam
