# itens-avulsos

## Requirements

### Requirement: Adicionar item avulso sem cadastrar no estoque

O usuário SHALL poder adicionar à lista um item que não existe na despensa e que NÃO deve ser cadastrado como produto permanente.

#### Scenario: Avulso criado

- **WHEN** o usuário adiciona um item avulso com nome, unidade e quantidade
- **THEN** ele aparece na lista, identificado como avulso

#### Scenario: Avulso não vira produto

- **WHEN** um item avulso é adicionado
- **THEN** nenhum produto novo aparece na despensa

#### Scenario: Preço opcional no avulso

- **WHEN** o usuário adiciona um avulso sem informar preço
- **THEN** ele entra na lista com custo zero e marcado como sem preço

#### Scenario: Nome obrigatório no avulso

- **WHEN** o usuário tenta adicionar um avulso sem nome
- **THEN** a adição é rejeitada com erro em texto

### Requirement: Compra aberta como recipiente dos avulsos

Adicionar um item avulso SHALL exigir uma compra em situação aberta, criada automaticamente caso ainda não exista. SHALL existir no máximo uma compra aberta por casa.

#### Scenario: Compra aberta criada sob demanda

- **WHEN** o primeiro avulso é adicionado e não há compra aberta
- **THEN** uma compra aberta é criada e o item é associado a ela

#### Scenario: Reuso da compra aberta

- **WHEN** um segundo avulso é adicionado e já existe compra aberta
- **THEN** ele é associado à compra existente, sem criar outra

#### Scenario: Unicidade garantida pelo banco

- **WHEN** uma segunda compra aberta é tentada para a mesma casa
- **THEN** a escrita é rejeitada por violação de unicidade

### Requirement: Editar e remover item avulso

O usuário SHALL poder alterar nome, quantidade, unidade e preço de um item avulso, e removê-lo da lista.

#### Scenario: Edição de avulso

- **WHEN** o usuário altera a quantidade de um avulso
- **THEN** a lista e o total estimado refletem a alteração

#### Scenario: Remoção de avulso

- **WHEN** um avulso é removido
- **THEN** ele desaparece da lista e o total é recalculado

#### Scenario: Remoção do último avulso mantém a compra

- **WHEN** o último item avulso é removido e ainda há itens em falta
- **THEN** a compra aberta permanece e a lista continua exibindo os itens em falta

### Requirement: Avulso não afeta o estoque em momento algum

Itens avulsos SHALL existir apenas dentro da compra e NÃO devem gerar movimento de estoque nem alterar quantidade de nenhum produto.

#### Scenario: Nenhum movimento gerado

- **WHEN** um avulso é adicionado, editado ou removido
- **THEN** nenhum movimento de estoque é gravado

#### Scenario: Avulso comprado não repõe estoque

- **WHEN** um item avulso é marcado como comprado e a compra é fechada
- **THEN** nenhuma quantidade de produto é alterada por causa dele
