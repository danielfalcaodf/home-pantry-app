# repositorios

## ADDED Requirements

### Requirement: Remoção lógica de produto limpa item "fora da lista por agora"

Ao remover logicamente um produto, o repositório SHALL apagar, na mesma transação, as linhas
de `compra_item` marcadas como "fora da lista por agora" (`excluido = true`) ligadas a esse
produto. Item pendente comum (`comprado = false`, `excluido = false`) e item já comprado NÃO
devem ser removidos.

#### Scenario: Item "fora da lista por agora" some ao excluir o produto

- **WHEN** um produto tem um item com `excluido = true` na compra aberta e o produto é removido
  logicamente
- **THEN** a linha de `compra_item` correspondente deixa de existir

#### Scenario: Item pendente comum permanece ao excluir o produto

- **WHEN** um produto tem um item pendente comum (`comprado = false`, `excluido = false`) na
  compra aberta e o produto é removido logicamente
- **THEN** a linha de `compra_item` permanece, ainda apontando para o produto (agora
  soft-deletado) — necessário para o detalhe da própria compra continuar funcionando

#### Scenario: Item já comprado não é afetado

- **WHEN** um produto tem um item com `comprado = true` em uma compra fechada e o produto é
  removido logicamente
- **THEN** a linha de `compra_item` permanece, ainda apontando para o produto (o FK
  `onDelete:'set null'` só dispara em DELETE físico, que a remoção lógica nunca faz)
