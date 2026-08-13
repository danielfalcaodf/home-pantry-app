---
description: F5 — gera/roda o fluxo Maestro E2E que cobre a capability de uma PR *(requer F4)*
argument-hint: [número da PR, 1-13 — se vazio, usa a próxima pendente]
---

Execute uma rodada da fase **F5** do plano de testes (`qa/PLANO-DE-TESTES.md`) para **uma PR**, sem alterar código de produção.

**Pré-requisito**: F4 precisa estar com pelo menos `smoke-launch.yaml` verde (emulador com build de development instalado e funcional). Se não estiver, pare e reporte — não gere flow contra um app que não abre.

**PR alvo**: $ARGUMENTS (se vazio, use a próxima PR sem seção `## F5` em `qa/por-pr/PR-NN.md`, seguindo a ordem de valor do plano-fonte: ciclo de compra → cadastro de produto → backup/restauração → conferência → troca de tema — não necessariamente a ordem numérica 1→13)

Passos:

1. Releia `qa/por-pr/PR-<NN>.md` para saber a capability e o caminho de tela que essa PR introduziu.
2. Verifique se já existe um flow em `.maestro/` cobrindo essa capability. Se sim, só rode (`mcp__maestro__run`) e pule para o passo 5.
3. Se não existe, invoque o subagent `test-automator` via `/qa:test` pedindo um flow Maestro novo para essa capability — ele já conhece `.maestro/README.md` (appId `com.danielfalcaodf.repor`, seletor por texto visível, nunca por índice, assertion no vocabulário da UI).
4. Antes de aceitar o flow gerado, use `mcp__maestro__inspect_screen` para conferir que os seletores batem com a hierarquia real da tela — não aceitar seletor chutado.
5. Rode o flow com `mcp__maestro__run` (`device_id` do `expo-dev`) até verde. Documente o side-effect real no banco no próprio arquivo `.yaml` (comentário), como o `README.md` exige.
6. Anexe seção `## F5 — Fluxo E2E` a `qa/por-pr/PR-<NN>.md`: nome do flow, caminho, resultado.
7. Falhas do fluxo (não do teste em si, mas de comportamento do app) viram achado em `qa/achados/`.
8. `git add qa/**` e o novo `.maestro/*.yaml`, commit.

Ao final, informe a próxima capability pendente na ordem de valor do plano-fonte, e se todas as 5 lacunas conhecidas (ciclo de compra, cadastro, backup/restauração, conferência, troca de tema) já têm flow.
