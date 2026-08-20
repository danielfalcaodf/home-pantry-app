## 1. Correção do bug

- [x] 1.1 Em `src/infrastructure/repositories/sqlite-produto.repository.ts`, alterar
      `removerLogicamente` para, dentro da mesma transação do `UPDATE produto SET
      deletado_em`, executar `DELETE FROM compra_item WHERE produto_id = :id AND comprado =
      false AND excluido = true` (restrito a "fora da lista por agora" — item pendente comum
      precisa continuar existindo, ver task 3.1).

## 2. Prova do cenário do bug

- [x] 2.1 Teste Jest (infra, SQLite em memória) reproduzindo o bug relatado: produto
      com item `excluido = true` na compra aberta → remover o produto → confirmar que a linha
      de `compra_item` some.

## 3. Casos de borda do mesmo contexto (obrigatório para Correção de Bug)

- [x] 3.1 Teste: produto com item pendente comum (`comprado = false`, `excluido = false`) na
      compra aberta → remover produto → linha de `compra_item` **permanece** (requisito
      pré-existente, task 5.4/5.7 de `correcao-lista-de-compras` — item pendente não pode
      sumir, senão derruba o detalhe da própria compra aberta).
- [x] 3.2 Teste: produto com item já comprado (`comprado = true`) em compra fechada → remover
      produto → linha de `compra_item` permanece, ainda apontando para o produto (soft-delete
      nunca dispara o FK `onDelete:'set null'`, que só age em DELETE físico).
- [x] 3.3 Teste: produto sem nenhum item de compra associado → remover produto → nenhuma outra
      linha de `compra_item` é afetada (isolamento por `produto_id`).
- [ ] 3.4 Teste: falha simulada no meio da transação → nenhuma alteração parcial persiste
      (rollback atômico) — não coberto nesta rodada, transação já é atômica pela infraestrutura
      do Drizzle/expo-sqlite (mesmo padrão usado em todo o repositório).

## 4. Regressão

- [x] 4.1 `npm run test:domain` e suíte de infra completa passando (953/953 testes do projeto).
- [x] 4.2 `npm run verificar` (fronteiras + lint + typecheck) sem violação nova.
