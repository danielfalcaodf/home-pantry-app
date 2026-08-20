# repositorios

## ADDED Requirements

### Requirement: Remoção lógica de produto limpa itens de compra pendentes

Ao remover logicamente um produto, o repositório SHALL apagar, na mesma transação, as linhas
de `compra_item` ligadas a esse produto que ainda não foram compradas (`comprado = false`) —
incluindo as marcadas como "fora da lista por agora" (`excluido = true`). Itens já comprados
NÃO devem ser removidos.

#### Scenario: Item "fora da lista por agora" some ao excluir o produto

- **WHEN** um produto tem um item com `excluido = true` na compra aberta e o produto é removido
  logicamente
- **THEN** a linha de `compra_item` correspondente deixa de existir

#### Scenario: Item pendente na compra aberta some ao excluir o produto

- **WHEN** um produto tem um item pendente (`comprado = false`, `excluido = false`) na compra
  aberta e o produto é removido logicamente
- **THEN** a linha de `compra_item` correspondente deixa de existir

#### Scenario: Item já comprado não é afetado

- **WHEN** um produto tem um item com `comprado = true` em uma compra fechada e o produto é
  removido logicamente
- **THEN** a linha de `compra_item` permanece, com `produto_id` nulo conforme o FK existente
