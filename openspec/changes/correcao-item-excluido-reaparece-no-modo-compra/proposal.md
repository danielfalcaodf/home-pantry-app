# Correção: item removido da lista reaparece no Modo Compra

**Type:** Correção de Bug

## Why

Remover um item faltante da lista ("Fora da lista por agora") grava a exclusão como
`excluido: true` na linha `compra_item` correspondente (design D1/D2 de `itens-avulsos`,
já implementado). Ao "Iniciar compra" logo em seguida, o mesmo item volta a aparecer no Modo
Compra como se nunca tivesse sido removido — a pessoa marca "Fora da lista por agora" e o app
ignora, silenciosamente.

Reproduzido lendo o código, não só relatado pelo usuário: `use-modo-compra.ts:52` chama
`compras.listarItens(compraId)` e usa o resultado inteiro (`use-modo-compra.ts:56`) sem
filtrar `excluido`. Todo outro consumidor de `compra_item` do projeto filtra esse campo —
`use-iniciar-compra.ts:35` e `use-lista-compras.ts:51` o fazem — só o Modo Compra não.

## What Changes

- **Modo Compra deixa de mostrar itens marcados como excluídos da compra aberta.** Um
  `.filter(({ item }) => !item.excluido)` em `use-modo-compra.ts`, no mesmo ponto em que os
  outros dois hooks já filtram.
- Nenhuma mudança de schema, de fluxo de remoção ou do mecanismo de reativação
  ("Voltar pra lista") — eles já funcionam corretamente em todo outro lugar do app. O defeito é
  local a um único ponto de leitura.

## Capabilities

### Modified Capabilities

- `modo-compra`: o requisito "Iniciar a compra a partir da lista" passa a garantir que um item
  excluído da lista antes de "Iniciar compra" não aparece na tela de Modo Compra.

## Impact

- **Código**: `src/application/compra/use-modo-compra.ts` (uma linha). Nenhum outro arquivo.
- **Camadas**: só `application/`.
- **Dependências**: nenhuma.
- **Testes**: cenário de infraestrutura/aplicação cobrindo o caminho exato do bug (remover →
  iniciar compra → item não aparece no Modo Compra) mais o caminho de reativação (reativar →
  iniciar compra → item aparece).

### Dependências entre changes

Nenhuma sobreposição de arquivo com nenhuma change ativa do `ORDER.md` — `use-modo-compra.ts`
não é tocado por nenhuma delas.
