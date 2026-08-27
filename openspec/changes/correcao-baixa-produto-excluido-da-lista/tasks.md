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

## 5. QA — E2E (Maestro) — PENDENTE

Cenários escritos nesta rodada de preparação e ainda **não executados** (change reaberta por
isso). Rodar todos no emulador/dispositivo de QA antes de arquivar de novo; ver
`PLANO-TESTES-E2E-CHANGES-REABERTAS.md` na raiz para o que cada um prova.

**Como executar:** por subagent + Maestro MCP — `/qa:ux` (`mobile-ux-tester`) para rodar e
investigar, `/qa:test` (`test-automator`) para corrigir flow, sempre com `inspect_screen` antes
de confiar num seletor. Nunca `maestro test` na mão.

**Se um flow reprovar por bug do app** (e não por seletor errado): não corrija o código direto.
Rodar `/opsx:update` nesta change primeiro — cenário novo no `specs/<capability>/spec.md`
descrevendo o comportamento correto, e tasks novas aqui (correção + teste do cenário do bug +
casos de borda do mesmo contexto, o ciclo obrigatório de Correção de Bug). Se o achado não
pertencer a esta change, `/opsx:propose` uma change nova e registrar no `ORDER.md`. A task do
cenário só é marcada `- [x]` com o flow verde — bug documentado não fecha task.

- [x] 5.1 `.maestro/bug-exclusao-produto-fora-da-lista-some.yaml` — repro do bug: item
      "Fora da lista por agora" some ao excluir o produto. Executado em 2026-08-21, passou.
- [x] 5.2 `.maestro/bug-exclusao-produto-recriar-mesmo-nome.yaml` — repro do relato original:
      recriar produto com o mesmo nome não ressuscita o registro órfão. Executado em
      2026-08-21, passou.
- [x] 5.3 `.maestro/bug-exclusao-produto-isolamento-outros-itens.yaml` — isolamento por
      `produto_id`: excluir um produto não limpa a seção inteira. Executado em 2026-08-21,
      passou.
- [x] 5.4 `.maestro/bug-exclusao-produto-historico-compra-fechada.yaml` — item já comprado em
      compra fechada continua no histórico (⚠️ fecha uma compra de verdade). Executado em
      2026-08-21, passou.
- [x] 5.5 Seletores revisados com `inspect_screen` durante a execução; nenhum precisou de
      ajuste no `.yaml`. Achado de ambiente (não do app): a bolha flutuante "Tools" do Expo
      dev-client sobrepõe os ícones do topo da tela e pode capturar o toque destinado a
      "Adicionar produto"/"Buscar" — arrastar a bolha para fora da área antes de rodar.

Cenário E2E descartado nesta preparação: "item pendente comum permanece na compra aberta ao
excluir o produto" chegou a virar flow e foi removido antes de rodar. O roteiro dependia de sair
do Modo Compra pelo "Voltar" deixando a compra aberta com o item pendente, e o usuário decidiu
mudar esse fluxo — sair pelo "Voltar" e confirmar "Sair" passará a cancelar a compra na prática,
e sem item marcado a compra também não sobrevive. O resultado esperado do cenário deixaria de
existir. A regra em si (item pendente comum NÃO é apagado pelo soft-delete do produto) continua
coberta pela task 3.1, no teste de infra com SQLite em memória.
