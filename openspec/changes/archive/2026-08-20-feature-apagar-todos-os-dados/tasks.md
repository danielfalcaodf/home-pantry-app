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
