---
description: Caça defeitos de UX/UI no app rodando (emulador/dispositivo) via o subagent mobile-ux-tester + Maestro MCP
argument-hint: [tela ou fluxo a testar — ex. "Despensa", "dar baixa", "os dois temas"]
---

Antes de invocar o subagent, confirme os pré-requisitos:
1. Existe um emulador/dispositivo Android conectado (`adb devices`). Se não houver, avise o usuário e pare — este comando não sobe o emulador sozinho.
2. O app Repor está instalado e, se for dev build, o Metro está rodando. Se não tiver certeza, pergunte ou verifique antes de prosseguir.
3. O MCP `maestro` está conectado (`claude mcp list` deve mostrar `maestro` como `Connected`, não `Pending approval`). Se estiver pendente, avise o usuário que precisa aprovar (`.mcp.json` do projeto exige aprovação interativa na primeira vez) antes de continuar — o subagent ainda funciona com `maestro test` via Bash como fallback, mas fica mais lento sem o MCP.

Depois de confirmar, invoque o subagent `mobile-ux-tester` (ferramenta de subagente — `Task`/`Agent`, `subagent_type: "mobile-ux-tester"`) para testar:

**Escopo**: $ARGUMENTS (se vazio, peça ao usuário pra especificar uma tela ou fluxo — este agente não faz varredura completa do app sem escopo definido, pra não gastar tempo em algo que não interessa agora)

Ao final, apresente o relatório de defeitos do subagent como veio (não resuma demais — severidade, reprodução e sugestão de correção importam pro usuário decidir o que corrigir primeiro).
