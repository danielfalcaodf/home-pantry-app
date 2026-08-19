## Context

`compra_item` tem um único campo `excluido` que serve dois propósitos ao mesmo tempo: marcar
que um faltante foi removido da Lista ("Fora da lista por agora", reativável) e, ao mesmo
tempo, ser a linha que o Modo Compra lista para a pessoa marcar durante a compra. Três hooks
leem essa tabela:

- `use-lista-compras.ts:51` — monta a Lista, filtra `excluido` corretamente (linha vira
  `desativados`, não `itens`).
- `use-iniciar-compra.ts:35` — decide o que materializar ao iniciar a compra, filtra
  `excluido` corretamente.
- `use-modo-compra.ts:52` — alimenta a tela de Modo Compra. **Não filtra.**

O terceiro é o único caminho de leitura que esqueceu o filtro. Não é ambiguidade de regra — as
outras duas leituras já mostram qual é a regra certa — é uma implementação que ficou pra trás.

## Goals / Non-Goals

**Goals:**

- Um item excluído da Lista nunca aparece como linha marcável no Modo Compra.
- Reativar o item ("Voltar pra lista") e então iniciar a compra continua funcionando —
  não é para quebrar o caminho que já está certo.

**Non-Goals:**

- Mudar o schema de `compra_item` ou o significado do campo `excluido`.
- Mudar o mecanismo de remoção/reativação da Lista — já correto, não é o defeito.
- Tocar `use-lista-compras.ts` ou `use-iniciar-compra.ts` — já filtram certo.

## Decisions

### 1. Filtrar em `use-modo-compra.ts`, replicando o padrão dos outros dois hooks

`recarregar` (`:50-60`) passa a filtrar `listaItens` por `!item.excluido` antes de
`setItens(...)`, no mesmo formato de `use-lista-compras.ts:51` e `use-iniciar-compra.ts:35`.

Alternativa descartada: filtrar na camada de `infrastructure/` (`SQLiteCompraRepository`), para
que `listarItens` nunca retorne excluídos. Descartada porque `use-lista-compras.ts` depende
justamente de receber os excluídos, para montar a seção `desativados` — mudar o repositório
quebraria esse consumidor.

## Risks / Trade-offs

- **[Um item marcado no Modo Compra e depois excluído da Lista por outro caminho]** — não
  existe hoje: a Lista só permite remover itens faltantes, e um item já marcado no Modo Compra
  não aparece mais na Lista como faltante (ele já foi materializado). Cenário sem caminho de
  UI que o produza; não precisa de tratamento especial.

## Migration Plan

Sem migração de dados nem de schema. Uma linha em `application/`.
