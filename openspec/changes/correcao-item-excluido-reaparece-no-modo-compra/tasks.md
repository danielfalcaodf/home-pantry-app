# Tasks — correcao-item-excluido-reaparece-no-modo-compra

**Type:** Correção de Bug. Corrigir primeiro, provar com o teste do cenário exato do defeito,
e então obrigatoriamente cobrir os casos de borda do mesmo contexto.

## 1. Correção

- [x] 1.1 `use-modo-compra.ts` (`recarregar`): `listaItens` filtrado por `!item.excluido` antes
  de `setItens(...)`, replicando o padrão de `use-lista-compras.ts` e `use-iniciar-compra.ts`.

## 2. Prova do cenário exato do defeito relatado

- [ ] 2.1–2.2 Teste de aplicação e reprodução Maestro ficam para a sessão de teste dedicada (ver
  ORDER.md).

## 3. Casos de borda do mesmo contexto (obrigatório)

- [ ] 3.1 Reativar o item removido ("Voltar pra lista") antes de iniciar a compra: ele volta a
  aparecer normalmente no Modo Compra.
- [ ] 3.2 Remover um item que já tinha sido materializado numa compra aberta anterior (linha de
  `compra_item` reaproveitada, marcada `excluido: true` em vez de inserida — ver
  `use-remover-item-lista.ts:59-63`): também some do Modo Compra.
- [ ] 3.3 Remover múltiplos itens da mesma lista antes de iniciar a compra: todos ficam de fora,
  nenhum falso positivo entre eles.
- [ ] 3.4 Compra já em andamento (retomada): itens marcados como comprados continuam visíveis;
  só os excluídos somem. Não pode regredir o cenário "Retomar compra em andamento" já existente
  em `modo-compra`.

## 4. Regressão

- [ ] 4.1 `npm run verificar` verde (fronteiras + lint + typecheck).
- [ ] 4.2 `npm test` verde, incluindo os testes de `use-modo-compra`, `use-lista-compras` e
  `use-iniciar-compra`.
- [ ] 4.3 `.maestro/jornada-completa-caminho-feliz.yaml` e `.maestro/auditoria-ui-ux-android.yaml`
  verdes ponta a ponta.
