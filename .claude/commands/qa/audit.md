---
description: Auditoria de estratégia de qualidade e lacunas de cobertura via o subagent qa-expert
argument-hint: [escopo opcional — ex. nome de uma change ou pasta]
---

**Antes de invocar**: confirme que `subagent_type: "qa-expert"` está disponível (ex. tente a invocação; se a ferramenta responder "agent type not found", o `.claude/agents/qa-expert.md` não existe neste worktree — comum quando o diretório atual é um worktree criado para uma PR antiga, cujo branch foi criado antes desse arquivo existir em `qa/plano-de-testes`). Nesse caso:
1. `git worktree list` para achar outro worktree que tenha o arquivo (normalmente o worktree principal, checkout de `qa/plano-de-testes`).
2. `cp <worktree-com-o-arquivo>/.claude/agents/qa-expert.md .claude/agents/qa-expert.md` no worktree atual (crie `.claude/agents/` se não existir).
3. Repita a invocação do subagent.
4. **Não** `git add`/commit esse arquivo copiado — é só para a subagent tool resolver o `subagent_type` nesta sessão; ele não pertence à mudança sendo testada.

Invoque o subagent `qa-expert` (ferramenta de subagente — `Task`/`Agent`, `subagent_type: "qa-expert"`) para auditar a qualidade do escopo indicado no projeto Repor.

**Escopo**: $ARGUMENTS (se vazio, considere o estado atual da branch — `git diff` contra a base — como escopo)

Este subagent **não escreve código nem teste** — ele audita e reporta lacunas priorizadas por severidade, seguindo as regras concretas do `CLAUDE.md` (cobertura ≥90% em domínio, fronteiras de camada, invariantes de banco como append-only e transação única, KPI K4, vocabulário).

Depois que o relatório voltar:
- Se houver itens críticos, pergunte ao usuário se quer que você já invoque `/qa:test` pra cobrir as lacunas apontadas, ou se prefere revisar o relatório primeiro.
- Não implemente nada por conta própria a partir do relatório sem confirmação — a auditoria é insumo pra decisão do usuário, não uma ordem de serviço automática.
