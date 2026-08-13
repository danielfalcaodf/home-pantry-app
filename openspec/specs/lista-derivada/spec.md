# lista-derivada

## Purpose

Definir a lista de compras como consulta derivada do estoque e dos itens avulsos da compra aberta — nunca uma tabela materializada — cobrindo cálculo de quantidade a comprar, ordenação/agrupamento, remoção sem efeito de estoque e o estado vazio.
## Requirements
### Requirement: Lista derivada, nunca materializada

A lista de compras SHALL ser composta em tempo de consulta a partir dos produtos cuja quantidade atual é menor que a necessária, unidos aos itens avulsos da compra aberta. NÃO deve existir tabela de lista de compras.

#### Scenario: Item em falta aparece automaticamente

- **WHEN** a quantidade de um produto cai abaixo da necessária
- **THEN** ele passa a aparecer na lista sem nenhuma ação do usuário

#### Scenario: Item reposto sai automaticamente

- **WHEN** a quantidade de um produto volta a atingir a necessária
- **THEN** ele deixa de aparecer na lista

#### Scenario: Sem tabela de lista

- **WHEN** o schema do banco é inspecionado
- **THEN** nenhuma tabela representa a lista de compras

#### Scenario: Lista reativa

- **WHEN** um consumo é registrado na despensa e o usuário abre a lista
- **THEN** a lista já reflete o novo estado, sem recarregamento manual

### Requirement: Quantidade a comprar calculada pelo domínio

Cada item da lista SHALL exibir a quantidade a comprar calculada pela regra de domínio, com arredondamento para cima em unidade indivisível. A consulta SHALL entregar apenas a diferença bruta, e NÃO deve replicar o arredondamento.

#### Scenario: Arredondamento em unidade indivisível

- **WHEN** um item em pacotes tem quantidade atual 2,5 e necessária 3
- **THEN** a lista exibe a quantidade a comprar de 1 pacote

#### Scenario: Fração preservada em unidade divisível

- **WHEN** um item em quilogramas tem quantidade atual 0,5 e necessária 2
- **THEN** a lista exibe a quantidade a comprar de 1,5 kg

#### Scenario: Regra não duplicada na consulta

- **WHEN** a consulta de faltantes é inspecionada
- **THEN** ela não contém nenhuma expressão de arredondamento por unidade

### Requirement: Ordenação e agrupamento por categoria

A lista SHALL ser ordenada por categoria e, dentro dela, por nome, e SHALL oferecer alternar entre a visão agrupada por categoria e a visão em lista contínua. O controle que alterna o agrupamento SHALL ter alvo de toque mínimo de 48×48dp.

#### Scenario: Visão agrupada

- **WHEN** o agrupamento por categoria está ativo
- **THEN** os itens aparecem sob cabeçalhos de categoria, em ordem alfabética dentro de cada grupo

#### Scenario: Visão contínua

- **WHEN** o agrupamento está desativado
- **THEN** os itens aparecem em lista única ordenada por nome

#### Scenario: Preferência de agrupamento mantida

- **WHEN** o usuário alterna o agrupamento e sai da tela
- **THEN** ao voltar, a escolha anterior permanece

#### Scenario: Alvo de toque do controle de agrupamento

- **WHEN** o botão "Agrupar por categoria" do cabeçalho da Lista é medido
- **THEN** sua área tocável mede no mínimo 48 por 48 pontos independentes, sem alterar seu tamanho visual

### Requirement: Remover item da lista sem alterar o estoque

O usuário SHALL poder remover um item da lista da compra corrente. A remoção NÃO deve alterar a quantidade em estoque nem o cadastro do produto.

#### Scenario: Remoção não afeta o estoque

- **WHEN** um item em falta é removido da lista
- **THEN** a quantidade do produto na despensa permanece inalterada

#### Scenario: Item removido não reaparece na mesma compra

- **WHEN** um item é removido da lista e a tela é reaberta
- **THEN** ele continua fora da lista, mesmo permanecendo abaixo do mínimo

#### Scenario: Remoção reversível na mesma sessão

- **WHEN** um item é removido da lista
- **THEN** uma ação de desfazer permite trazê-lo de volta

#### Scenario: Item volta em uma compra futura

- **WHEN** a compra corrente é fechada e o item continua abaixo do mínimo
- **THEN** ele volta a aparecer na próxima lista

### Requirement: Estado vazio da lista

Quando nenhum item estiver faltando, a lista SHALL exibir uma mensagem afirmativa, e não um aviso de ausência de dados.

#### Scenario: Nada faltando

- **WHEN** todos os itens estão no nível definido
- **THEN** é exibida a mensagem informando que nada está faltando

#### Scenario: Adicionar avulso continua possível

- **WHEN** a lista está vazia
- **THEN** a ação de adicionar um item avulso permanece acessível

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

