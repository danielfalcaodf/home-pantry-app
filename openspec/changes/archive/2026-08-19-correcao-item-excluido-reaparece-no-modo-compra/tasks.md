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

- [x] 3.1 Reativar o item removido ("Voltar pra lista") antes de iniciar a compra: ele volta a
  aparecer normalmente no Modo Compra — confirmado 2026-08-19 no emulador: "Arroz" removido,
  reativado via "Voltar pra lista", contagem da lista voltou a 39, compra iniciada mostra
  "0 de 39" com Arroz presente e "Feijão" (excluído sem reativar) ausente mesmo rolando a
  lista inteira (`scrollUntilVisible` não encontra).
- [ ] 3.2 Remover um item que já tinha sido materializado numa compra aberta anterior (linha de
  `compra_item` reaproveitada, marcada `excluido: true` em vez de inserida — ver
  `use-remover-item-lista.ts:59-63`): também some do Modo Compra.
- [ ] 3.3 Remover múltiplos itens da mesma lista antes de iniciar a compra: todos ficam de fora,
  nenhum falso positivo entre eles.
- [ ] 3.4 Compra já em andamento (retomada): itens marcados como comprados continuam visíveis;
  só os excluídos somem. Não pode regredir o cenário "Retomar compra em andamento" já existente
  em `modo-compra`.

## 4. Regressão

- [x] 4.1 `npm run verificar` verde (fronteiras + lint + typecheck) — confirmado 2026-08-19,
  suíte completa do repositório (104 suítes) verde.
- [x] 4.2 `npm test` verde, incluindo os testes de `use-modo-compra`, `use-lista-compras` e
  `use-iniciar-compra` — 17/17 testes verdes nos 3 arquivos, confirmado 2026-08-19.
- [ ] 4.3 `.maestro/jornada-completa-caminho-feliz.yaml` e `.maestro/auditoria-ui-ux-android.yaml`
  verdes ponta a ponta.

## Pendências desta rodada de teste (2026-08-18)

- [x] 2.1/2.2 confirmado reproduzindo o cenário exato: item "Aveia" excluído da lista, compra
  iniciada com 33 itens, `scrollUntilVisible` não encontra "Aveia" em nenhum lugar do Modo
  Compra ("No visible element found: Aveia"). Sem falha de teste automatizado associada — esta
  é a única das 11 changes sem nenhuma falha em `npm test`.
- Restante da seção 3 (casos de borda: 3.1-3.4) não testado nesta rodada.
