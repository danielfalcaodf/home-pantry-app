## Context

`compra_item` guarda tanto itens ligados a um produto (`produto_id` preenchido) quanto itens
avulsos (`produto_id` null). O flag `excluido` marca "fora da lista por agora" — é setado pelo
usuário na Lista de Compras e hoje só é limpo por `use-dar-baixa.ts` quando o mesmo produto
sofre uma nova baixa. `removerLogicamente` (soft-delete de produto) nunca interage com essa
tabela. A constraint `ck_compra_item_excluido_produto` (schema.ts) assume `excluido = 0 OR
produto_id IS NOT NULL` — ou seja, o design já espera que uma linha excluída aponte para um
produto vivo; um produto soft-deletado quebra essa invariante implicitamente (o produto_id
segue preenchido, mas o produto não existe mais para fins de negócio).

## Goals / Non-Goals

**Goals:**
- Ao excluir um produto, nenhuma linha de `compra_item` marcada "fora da lista por agora"
  (`excluido = true`) continua referenciando esse produto depois da operação.
- A limpeza acontece na mesma transação do soft-delete — sem estado intermediário inconsistente.

**Non-Goals:**
- Não mexer no fluxo de reativação existente em `use-dar-baixa.ts`.
- Não alterar itens já comprados (`comprado = true`) — são histórico de compra fechada.
- Não alterar item pendente comum (`excluido = false`) — existe um requisito anterior (task
  5.4/5.7 de `correcao-lista-de-compras`, coberto em
  `sqlite-compra.repository.test.ts`) de que um item pendente numa compra aberta continua
  aparecendo mesmo com o produto removido, para não derrubar o detalhe da própria compra.
- Não mudar schema/migration — a constraint e o FK atuais já suportam a limpeza via DELETE
  explícito.

## Decisions

- **DELETE explícito em vez de depender do FK `onDelete: 'set null'`**: o FK só dispara em
  DELETE físico da linha de produto, mas `removerLogicamente` é soft-delete por design (histórico
  auditável, `deletadoEm`). Decisão: `removerLogicamente` executa
  `DELETE FROM compra_item WHERE produto_id = :id AND comprado = false AND excluido = true`
  como parte da mesma transação Drizzle do `UPDATE produto`.
- **Escopo do DELETE restrito a `excluido = true`**: tentativa inicial de cobrir também item
  pendente comum (`excluido = false`) foi revertida — quebrava o requisito existente citado
  acima (item pendente precisa continuar visível no detalhe da compra aberta). O bug relatado
  pelo usuário é especificamente sobre "fora da lista por agora"; ampliar o escopo além disso
  não tinha pedido nem necessidade.

## Risks / Trade-offs

- [Risco] Excluir um produto no meio de uma compra em andamento remove silenciosamente o item
  dessa compra, sem aviso ao usuário → Mitigação: comportamento já é implícito (produto não
  existe mais, item não compra do é impossível), consistente com a UX atual de "tirar da
  despensa"; fora de escopo desta change adicionar confirmação extra (já existe confirmação de
  exclusão de produto).
- [Risco] Falha no meio da transação deixa `compra_item` órfão de novo → Mitigação: usar a
  transação Drizzle já existente no client (`db.transaction`), garantindo atomicidade.
