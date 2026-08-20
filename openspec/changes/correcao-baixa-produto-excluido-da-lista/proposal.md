## Why

Ao excluir um produto da despensa, o item correspondente que estava marcado como "fora da
lista por agora" (ou qualquer item pendente da compra aberta) na Lista de Compras não é
removido: `removerLogicamente` faz apenas soft-delete do produto (`UPDATE produto SET
deletado_em`), então o FK `onDelete: 'set null'` de `compra_item.produto_id` nunca dispara (só
dispara em DELETE físico). O item continua preso apontando para um produto morto e reaparece
indefinidamente na seção "fora da lista por agora", mesmo que o usuário recrie um produto com
o mesmo nome (novo `id`, sem relação com o registro órfão).

## What Changes

- `removerLogicamente` (produto) passa a apagar, na mesma transação do soft-delete, as linhas
  de `compra_item` ligadas ao produto que ainda não foram compradas (`comprado = false`) —
  cobre tanto os itens marcados `excluido = true` ("fora da lista por agora") quanto qualquer
  item ainda pendente na compra aberta. Itens já comprados (`comprado = true`) não são tocados
  — continuam sendo histórico de compra fechada, tratado pelo FK existente.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `repositorios`: `removerLogicamente` do repositório de produto passa a limpar itens de
  compra pendentes/excluídos ligados ao produto removido, na mesma transação do soft-delete.

## Impact

- `src/infrastructure/repositories/sqlite-produto.repository.ts` (`removerLogicamente`)
- Testes: `src/infrastructure/repositories/sqlite-produto.repository.test.ts` (Jest + SQLite em
  memória)
- Sem mudança de schema/migration — a coluna `excluido` e o FK já existem.
