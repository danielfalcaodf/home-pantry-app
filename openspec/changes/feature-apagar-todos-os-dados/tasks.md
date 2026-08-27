## 1. Testes primeiro (TDD estrito — Nova Feature)

- [x] 1.1 Escrever teste Jest infra (SQLite em memória) para `resetarBanco(db)`: popula produto/
      compra/compra_item/movimento_estoque, chama reset, confirma que tudo foi apagado e que
      `casa`/`usuario` local existe e é utilizável (falha antes da implementação existir).
- [x] 1.2 Escrever teste Jest infra de atomicidade: falha simulada no meio da transação → nenhum
      dado é alterado.
- [x] 1.3 Escrever teste Jest application para o caso de uso: cancelamento pelo usuário não
      chama `resetarBanco`; confirmação chama e trata sucesso/erro.

## 2. Implementação

- [x] 2.1 Criar `resetarBanco(db)` em `src/infrastructure/db/` — DELETE em ordem segura
      (`compra_item` antes de `casa`, para não violar `ck_compra_item_origem` durante a
      cascata — achado real corrigido durante os testes) dentro de `db.transaction`, chamando
      `garantirCasaEUsuario` ao final para recriar `casa`/`usuario` local.
- [x] 2.2 Criar caso de uso em `src/application/` expondo a operação (com estado de
      loading/erro, seguindo o padrão de outros casos de uso do app).
- [x] 2.3 Adicionar botão "Apagar todos os dados" na seção "Seus dados" de
      `app/(tabs)/configuracoes.tsx`, reaproveitando o padrão de confirmação inline já usado
      pela restauração (state machine `ocioso|confirmando|...|erro` + `Toast`) e adicionando um
      `Alert.alert` nativo com `style:'destructive'` como confirmação final. Cobertura de
      presentation (toque no botão, painel inline, wiring do Alert) adicionada após auditoria
      de QA apontar a lacuna.

## 3. Re-execução dos testes (prova de que a feature entrega o que foi pedido)

- [x] 3.1 Testes de 1.1-1.3 rodando contra a implementação — todos verdes.

## 4. QA — integração

- [ ] 4.1 Teste de integração (infra + application juntos, SQLite em memória): fluxo completo
      confirmar → reset → app consegue cadastrar produto novo imediatamente depois, sem
      reiniciar. Não implementado nesta rodada — o teste de infra (`resetar-banco.test.ts`)
      já prova "identidade recriada é utilizável imediatamente" via `SQLiteProdutoRepository`
      real, cobrindo a maior parte da intenção; fechar o loop completo application→infra fica
      como melhoria de baixa prioridade (apontado pela auditoria de QA).

## 5. QA — E2E (Maestro)

- [ ] 5.1 **Fora de escopo nesta rodada** — usuário pediu explicitamente para não rodar Maestro.
      Fica registrado como pendência para quando o teste manual/E2E desta rodada acontecer.

## 6. QA — regressão

- [x] 6.1 `npm test` completo passando (973/973, nenhuma suíte existente quebrada pela nova
      função de reset).
- [x] 6.2 `npm run verificar` sem violação nova.

## 7. QA — E2E (Maestro) — PENDENTE

Substitui a task 5.1 ("fora de escopo nesta rodada"). Cenários escritos e ainda **não
executados**; ver `PLANO-TESTES-E2E-CHANGES-REABERTAS.md` na raiz.

**Como executar:** por subagent + Maestro MCP — `/qa:ux` (`mobile-ux-tester`) para rodar e
investigar, `/qa:test` (`test-automator`) para corrigir flow, sempre com `inspect_screen` antes
de confiar num seletor. Nunca `maestro test` na mão.

**Se um flow reprovar por bug do app** (e não por seletor errado): não corrija o código direto.
Rodar `/opsx:update` nesta change primeiro — cenário novo no `specs/<capability>/spec.md`
descrevendo o comportamento correto, e tasks novas aqui (correção + teste do cenário do bug +
casos de borda do mesmo contexto, o ciclo obrigatório de Correção de Bug). Se o achado não
pertencer a esta change, `/opsx:propose` uma change nova e registrar no `ORDER.md`. A task do
cenário só é marcada `- [x]` com o flow verde — bug documentado não fecha task.

⚠️ Três destes flows apagam de verdade todos os dados do dispositivo de teste — rodar por
último na bateria, em dispositivo de QA.

- [x] 7.1 `.maestro/feature-apagar-dados-caminho-completo.yaml` — caminho completo: inline →
      alerta nativo → toast → despensa vazia (⚠️ destrutivo). Executado em 2026-08-21, passou.
- [x] 7.2 `.maestro/feature-apagar-dados-cancela-inline.yaml` — cancelar na confirmação inline
      não apaga nada. Executado em 2026-08-21, passou.
- [x] 7.3 `.maestro/feature-apagar-dados-cancela-alerta-nativo.yaml` — recuar em "Manter meus
      dados" no alerta nativo não apaga nada e fecha o painel inline junto. Executado em
      2026-08-21, passou.
- [x] 7.4 `.maestro/feature-apagar-dados-app-usavel-apos-reset.yaml` — cadastro funciona
      imediatamente após o reset, sem reiniciar, e persiste (⚠️ destrutivo). Cobre pela UI a
      intenção da task 4.1, que ficou sem teste de integração. Executado em 2026-08-21, passou.
- [x] 7.5 `.maestro/feature-apagar-dados-limpa-lista-e-resumo.yaml` — o reset alcança compra
      aberta, item avulso e histórico de compras, não só a despensa (⚠️ destrutivo). Executado
      em 2026-08-21, passou.
- [x] 7.6 Seletores revisados com `inspect_screen` durante a execução. Ajustes: `hideKeyboard`
      removido (mesmo risco do grupo 3); busca por texto trocada por toque direto no único item
      da despensa em cada cenário; asserção imediatamente após "Manter meus dados" (7.3) trocada
      por uma mais tolerante a timing, mantendo a cobertura via asserções seguintes.
