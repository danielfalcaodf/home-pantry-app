---
description: Auditoria de estratégia de qualidade e lacunas de cobertura via o subagent qa-expert
argument-hint: [escopo opcional — ex. nome de uma change ou pasta]
---

Invoque o subagent `qa-expert` (ferramenta de subagente — `Task`/`Agent`, `subagent_type: "qa-expert"`) para auditar a qualidade do escopo indicado no projeto Repor.

**Escopo**: $ARGUMENTS (se vazio, considere o estado atual da branch — `git diff` contra a base — como escopo)

Este subagent **não escreve código nem teste** — ele audita e reporta lacunas priorizadas por severidade, seguindo as regras concretas do `CLAUDE.md` (cobertura ≥90% em domínio, fronteiras de camada, invariantes de banco como append-only e transação única, KPI K4, vocabulário).

Depois que o relatório voltar:
- Se houver itens críticos, pergunte ao usuário se quer que você já invoque `/qa:test` pra cobrir as lacunas apontadas, ou se prefere revisar o relatório primeiro.
- Não implemente nada por conta própria a partir do relatório sem confirmação — a auditoria é insumo pra decisão do usuário, não uma ordem de serviço automática.
