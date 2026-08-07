---
description: Executa uma rodada da F2 (cadeia incremental) do plano de testes — testa uma PR isolada em worktree
argument-hint: [número da PR, 1-13 — se vazio, usa a próxima pendente em qa/PLANO-DE-TESTES.md]
---

Execute uma rodada da fase F2 do plano de testes (`qa/PLANO-DE-TESTES.md`), **sem alterar código de produção**.

**PR alvo**: $ARGUMENTS (se vazio, leia `qa/PLANO-DE-TESTES.md` e pegue a primeira linha da tabela de PRs ainda `pendente`)

Passos:

1. Resolva o branch correspondente na tabela de PRs de `qa/PLANO-DE-TESTES.md`.
2. `git worktree add ../qa-pr<NN> <branch>` (use `origin/<branch>` se o branch local não existir).
3. `cd ../qa-pr<NN> && npm ci`
4. `npm run verificar && npm test` — capture a saída real (não resuma antes de ter os números).
5. Preencha `qa/por-pr/PR-<NN>.md` (no worktree principal, não no worktree novo) com: branch, commit, resultado de `verificar`, resultado de `test` (suites/testes passando e falhando), e o checklist específico dessa PR (ver tabela da F2 no plano-fonte, `/home/devdaniel/.claude/plans/quero-cria-um-plano-resilient-flute.md`).
6. Para cada falha ou lacuna encontrada, registre um `qa/achados/ACHADO-NNN.md` seguindo `qa/achados/README.md` — nunca corrija.
7. Marque a linha da PR como `concluída` (ou `bloqueada` com o motivo) em `qa/PLANO-DE-TESTES.md`.
8. `cd -` e `git worktree remove ../qa-pr<NN>`.
9. `git add qa/**` e commit só isso — nenhum arquivo fora de `qa/` deve entrar no commit desta rodada.

Ao final, informe qual foi a próxima PR pendente (para a próxima invocação, seja `/loop` ou manual).
