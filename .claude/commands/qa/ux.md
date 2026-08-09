---
description: Caça defeitos de UX/UI no app rodando (emulador/dispositivo) via o subagent mobile-ux-tester + Maestro MCP
argument-hint: [tela ou fluxo a testar — ex. "Despensa", "dar baixa", "os dois temas"]
---

Antes de invocar o subagent, confirme os pré-requisitos:
1. Existe um emulador/dispositivo Android conectado (`adb devices`). Se não houver, avise o usuário e pare — este comando não sobe o emulador sozinho.
2. O app Repor está instalado e, se for dev build, o Metro está rodando. Se não tiver certeza, pergunte ou verifique antes de prosseguir.
3. O MCP `maestro` está conectado (`claude mcp list` deve mostrar `maestro` como `Connected`, não `Pending approval`). Se estiver pendente, avise o usuário que precisa aprovar (`.mcp.json` do projeto exige aprovação interativa na primeira vez) antes de continuar — o subagent ainda funciona com `maestro test` via Bash como fallback, mas fica mais lento sem o MCP.

Depois de confirmar os pré-requisitos acima, confirme também que `subagent_type: "mobile-ux-tester"` está disponível (ex. tente a invocação; se a ferramenta responder "agent type not found", o `.claude/agents/mobile-ux-tester.md` não existe neste worktree — comum quando o diretório atual é um worktree criado para uma PR antiga, cujo branch foi criado antes desse arquivo existir em `qa/plano-de-testes`). Nesse caso:
1. `git worktree list` para achar outro worktree que tenha o arquivo (normalmente o worktree principal, checkout de `qa/plano-de-testes`).
2. `cp <worktree-com-o-arquivo>/.claude/agents/mobile-ux-tester.md .claude/agents/mobile-ux-tester.md` no worktree atual (crie `.claude/agents/` se não existir).
3. Repita a invocação do subagent.
4. **Não** `git add`/commit esse arquivo copiado — é só para a subagent tool resolver o `subagent_type` nesta sessão; ele não pertence à mudança sendo testada.

Invoque o subagent `mobile-ux-tester` (ferramenta de subagente — `Task`/`Agent`, `subagent_type: "mobile-ux-tester"`) para testar:

**Escopo**: $ARGUMENTS (se vazio, peça ao usuário pra especificar uma tela ou fluxo — este agente não faz varredura completa do app sem escopo definido, pra não gastar tempo em algo que não interessa agora)

Ao final, apresente o relatório de defeitos do subagent como veio (não resuma demais — severidade, reprodução e sugestão de correção importam pro usuário decidir o que corrigir primeiro).
