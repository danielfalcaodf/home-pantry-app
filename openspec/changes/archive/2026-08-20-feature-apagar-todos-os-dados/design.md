## Context

Todas as tabelas de dado (`produto`, `compra`, `compra_item`, `movimento_estoque`,
`configuracao`) referenciam `casa` com `onDelete:'cascade'` (exceto `compraItem.produtoId`,
`set null`). `PRAGMA foreign_keys=ON` já está ligado no client (`src/infrastructure/db/client.ts`).
`DELETE FROM casa` cascatearia tudo, mas apagaria a própria linha que `garantirCasaEUsuario`
(`src/infrastructure/db/seed.ts`) espera existir e não recria sozinha em runtime — só na
abertura do app. Não existe hoje nenhuma função de wipe: `SQLiteBackupRepository.restaurar` é
merge/upsert (`onConflictDoUpdate`), nunca deleta linha que já existe localmente e não está no
backup.

## Goals / Non-Goals

**Goals:**
- Apagar produto, compra, compra_item, movimento_estoque e configuração do usuário atual, numa
  transação atômica.
- App continua funcional imediatamente após o reset, sem reiniciar (casa/usuário recriados).

**Non-Goals:**
- Não fazer backup automático antes de apagar — é ação destrutiva direta, mesmo padrão que
  "restaurar backup" já usa hoje (o usuário é responsável por ter feito backup antes, se quiser).
- Não afetar preferência de tema/outras configurações de app fora do escopo de dados de estoque
  (a decidir em tasks se `configuracao` inclui preferência de tema — verificar schema antes de
  implementar).

## Decisions

- **DELETE explícito por tabela filha→pai dentro de `db.transaction`**, em vez de
  `DELETE FROM casa` + depender do cascade: evita apagar a própria linha de `casa`/`usuario`
  que o app espera existir sempre, sem precisar recriar via reinício.
- **Confirmação em duas camadas** (padrão inline de "confirmando" já usado pela restauração +
  `Alert.alert` nativo `style:'destructive'`): a restauração já usa só o padrão inline porque
  ela é reversível (dados antigos não se perdem, é upsert); apagar tudo é irreversível de
  verdade, então ganha a camada extra do alert nativo — alinhado à recomendação do Apple HIG de
  reservar alerts pra ações raras e irreversíveis.

## Risks / Trade-offs

- [Risco] Maior risco de dado real do lote inteiro (ação irreversível) → Mitigação: dupla
  confirmação, `Alert.alert` com botão destrutivo não-default, mesma UX de "restaurar" já
  validada no app.
- [Risco] Reset parcial por falha no meio da transação → Mitigação: `db.transaction` garante
  atomicidade; testar cenário de falha simulada.
- [Risco] App fica sem `casa`/`usuario` depois do reset se `garantirCasaEUsuario` não rodar de
  novo → Mitigação: chamar `garantirCasaEUsuario` explicitamente ao final da mesma transação/
  operação, testado.
