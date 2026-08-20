## 1. Correção do bug

- [ ] 1.1 Em `src/infrastructure/repositories/sqlite-produto.repository.ts`, alterar
      `removerLogicamente` para, dentro da mesma transação do `UPDATE produto SET
      deletado_em`, executar `DELETE FROM compra_item WHERE produto_id = :id AND comprado =
      false`.

## 2. Prova do cenário do bug

- [ ] 2.1 Escrever teste Jest (infra, SQLite em memória) reproduzindo o bug relatado: produto
      com item `excluido = true` na compra aberta → remover o produto → confirmar que a linha
      de `compra_item` some. Rodar antes do fix (falha) e depois do fix (passa).

## 3. Casos de borda do mesmo contexto (obrigatório para Correção de Bug)

- [ ] 3.1 Teste: produto com item pendente (`comprado = false`, `excluido = false`) na compra
      aberta → remover produto → linha de `compra_item` some.
- [ ] 3.2 Teste: produto com item já comprado (`comprado = true`) em compra fechada → remover
      produto → linha de `compra_item` permanece com `produto_id = null` (regressão do FK
      existente).
- [ ] 3.3 Teste: produto sem nenhum item de compra associado → remover produto → nenhuma outra
      linha de `compra_item` é afetada (isolamento por `produto_id`).
- [ ] 3.4 Teste: falha simulada no meio da transação → nenhuma alteração parcial persiste
      (rollback atômico).

## 4. Regressão

- [ ] 4.1 `npm run test:domain` e suíte de infra completa passando.
- [ ] 4.2 `npm run verificar` (fronteiras + lint + typecheck) sem violação.
