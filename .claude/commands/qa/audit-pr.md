---
description: F3 — audita a conformidade de uma PR contra os specs OpenSpec da change correspondente
argument-hint: [número da PR, 1-13 — se vazio, usa a próxima pendente]
---

Execute uma rodada da fase **F3** do plano de testes (`qa/PLANO-DE-TESTES.md`) para **uma PR**, sem alterar código de produção.

**PR alvo**: $ARGUMENTS (se vazio, abra `qa/por-pr/PR-01.md` … `PR-13.md` em ordem e pegue a primeira que não tem seção `## F3` ainda)

Passos:

1. Resolva o branch da PR na tabela de `qa/PLANO-DE-TESTES.md` e a change OpenSpec correspondente (mesmo slug, sem prefixo `change/`/`feature/`/`feat/`) em `openspec/changes/archive/<data>-<slug>/`.
2. Liste as capabilities dessa change (`ls openspec/changes/archive/<data>-<slug>/specs/`).
3. Para cada capability, invoque o subagent `qa-expert` via `/qa:audit <capability>` — ele é read-only (`Read, Grep, Glob, Bash`) e mapeia cada `#### Scenario:` do spec para o teste que o cobre, ou marca como descoberto.
4. Agregue o resultado das capabilities dessa PR em uma matriz `capability × cenário × teste` e anexe como seção `## F3 — Conformidade com specs` ao final de `qa/por-pr/PR-<NN>.md` (não crie arquivo novo).
5. Atualize `qa/fases/F3-conformidade-spec.md` com a linha/matriz consolidada dessa PR (crie o arquivo se ainda não existir, seguindo o formato de `qa/fases/F2-cadeia-incremental.md` como referência de estilo).
6. Para cada lacuna encontrada (cenário sem teste, arquivo sem cobertura), registre um `qa/achados/ACHADO-NNN.md` seguindo `qa/achados/README.md` — nunca corrija, apenas descreva.
7. `git add qa/**` e commit só isso.

Ao final, informe qual foi a próxima PR sem seção `## F3` (para a próxima invocação, seja `/loop` ou manual). Se todas as 13 já tiverem `## F3`, informe que a fase está completa e sugira consolidar `qa/fases/F3-conformidade-spec.md` como concluída.
