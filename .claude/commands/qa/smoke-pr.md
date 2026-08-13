---
description: F4 — roda o smoke test no emulador para as capabilities introduzidas por uma PR *(requer development build instalado)*
argument-hint: [número da PR, 1-13 — se vazio, usa a próxima pendente]
---

Execute uma rodada da fase **F4** do plano de testes (`qa/PLANO-DE-TESTES.md`) para **uma PR**, sem alterar código de produção.

**Pré-requisito único, verifique antes de tudo**: existe development build instalado no emulador `expo-dev`? Rode `mcp__maestro__list_devices` — se nenhum device aparecer, ou se o app `com.danielfalcaodf.repor` não abrir com `launchApp`, **pare e reporte**: a F4 depende de `eas login` + `eas build --profile development` + instalação manual no AVD, que ninguém fez ainda nesta sessão. Não tente contornar rodando em modo Expo Go.

**PR alvo**: $ARGUMENTS (se vazio, use a próxima PR sem seção `## F4` em `qa/por-pr/PR-NN.md`, na ordem 1→13)

Passos (só depois do pré-requisito confirmado):

1. Releia `qa/por-pr/PR-<NN>.md` para saber qual capability/tela essa PR introduziu.
2. `mcp__maestro__list_devices` → pegue o `device_id` do emulador `expo-dev`.
3. `mcp__maestro__inspect_screen` na tela relevante à capability da PR, antes de rodar qualquer flow — não assuma hierarquia de view sem checar.
4. Rode os flows existentes em `.maestro/` que cobrem essa capability (`mcp__maestro__run` com `device_id`). Hoje só existem `smoke-launch.yaml` e `dar-baixa-caminho-critico.yaml` — se a PR não tem flow próprio ainda, rode `smoke-launch.yaml` como piso mínimo e registre que um flow dedicado é trabalho da F5, não desta fase.
5. Capture evidência: `mcp__maestro__take_screenshot`. Atenção: em AVDs com múltiplos displays, confira `adb shell dumpsys activity activities | grep -E "Display #|topResumedActivity"` antes de aceitar a screenshot como válida.
6. Anexe seção `## F4 — Smoke no emulador` a `qa/por-pr/PR-<NN>.md` com o resultado real (flow rodado, passou/falhou, caminho da evidência).
7. Falhas viram achado em `qa/achados/`, nunca correção.
8. `git add qa/**` (e a screenshot, se for salva dentro do repo em `qa/`) e commit.

Ao final, informe a próxima PR pendente de F4 e se as tasks `4.3`/`4.4` (change 1) e `10.5` (change 3) já podem ser fechadas conforme o critério de saída da F4.
