## F4 — Smoke no emulador

**Estado: concluída (13/13)** em 2026-08-09. Bloqueio original (`eas login` + development build) foi removido em 2026-08-08; a execução completa da campanha (uma PR por hora, via loop/cron) fechou a fase no dia seguinte.

## Execução (2026-08-08 → 2026-08-09)

- Emulador `expo-dev` + Metro (`npx expo start --dev-client`) + `adb reverse tcp:8081 tcp:8081` ficaram de pé durante toda a campanha, reaproveitados entre rodadas.
- `/qa:smoke-pr` rodou uma PR por vez, na ordem 1→13, cada rodada disparada por um cron horário (`Analise... escolha APENAS UMA PR pendente...`).
- Cada PR recebeu: seção `## F4` em `qa/por-pr/PR-NN.md` com o que foi testado e por quê (incluindo o que foi deliberadamente **não** acionado, e a razão); evidências (`screencap` via `adb`) em `qa/por-pr/evidencias/PR-NN/`; commit próprio; comentário de merge-readiness na PR real do GitHub (`gh pr comment`).
- **Ressalva metodológica, válida para as 13 rodadas**: os testes rodaram sobre o estado acumulado da branch `qa/plano-de-testes` (PRs 1-13 já mescladas sequencialmente nela), não sobre um checkout isolado do commit de cada PR — decisão explícita do usuário em vez de isolar via worktree, documentada em cada comentário do GitHub.
- **Ações deliberadamente evitadas** por serem destrutivas/irreversíveis ou por risco de travar a automação (share sheet nativo, dialogs do sistema): restaurar backup, remover produto/item da lista, compartilhar lista/backup, e **fechar uma compra até o fim** — esta última nunca foi exercitada em nenhuma rodada, ficando como gap explícito para a F5 (ver `qa/PLANO-DE-TESTES.md`, "Próximo passo").
- Achados críticos da F2 (ACHADO-006, ACHADO-007) foram revalidados durante a F4 e confirmados corrigidos no estado acumulado (`npm run verificar` limpo em todas as rodadas).
- Regressão visual/animação encontrada e corrigida ainda na F2 (crash do stepper por falta de `'worklet'`) foi reconfirmada corrigida em runtime na rodada da PR-13 (Repor + Usei repetidos sem crash).

## Verificação de desbloqueio

1. `eas login` já estava feito (`npx eas-cli whoami` → conta `danielfalcaodf`, `danielfalcao.df@gmail.com`).
2. AVD Android disponível: `emulator -list-avds` → `expo-dev`.
3. **Ambiente é headless** (sem display) — `emulator -avd expo-dev -no-window ...` falha (`Fatal: no Qt platform plugin`, tenta carregar `xcb` mesmo com `-no-window`). A flag que funciona neste ambiente é **`-no-qt`**, não `-no-window`:
   ```
   emulator -avd expo-dev -no-qt -no-snapshot-load -no-boot-anim -gpu swiftshader_indirect
   ```
   Rodar em background via `run_in_background` do Bash tool (backgrounding manual com `&`/`disown` não sobreviveu ao fim do comando neste sandbox — processo morria silenciosamente).
4. Emulador bootou (~3 min): `adb devices` → `emulator-5554 device`; `adb shell getprop sys.boot_completed` → `1`.
5. Existe um **development build já compilado** e não versionado (gerado localmente, `android/` está no `.gitignore`): `android/app/build/outputs/apk/debug/app-debug.apk` (datado de 6/ago/2026).
6. Instalado com sucesso: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk` → `Success`.
7. App abre normalmente: `adb shell monkey -p com.danielfalcaodf.repor -c android.intent.category.LAUNCHER 1` → `topResumedActivity=...DevLauncherActivity`. Screenshot confirma a tela padrão do Expo Dev Client ("Repor — Development Build", campo para conectar em `npx expo start`).

## O que falta para rodar os smoke tests de fato

Só falta subir o Metro (`npm start` ou `npx expo start --dev-client`) e conectar o dev client rodando no emulador — a partir daí, `/qa:smoke-pr` pode rodar normalmente PR a PR. Nada de infraestrutura falta.

## Nota para a próxima sessão que rodar F4

- Usar `-no-qt` (não `-no-window`) para o emulador subir headless neste ambiente.
- O APK de debug já existe em `android/app/build/outputs/apk/debug/app-debug.apk`, mas é artefato local (gitignored) — se não existir mais (build limpo, novo checkout), rodar `npx expo run:android` ou `eas build --profile development --platform android` para gerar um novo antes de instalar.
- Emulador demora ~3 min para completar o boot neste ambiente (swiftshader/software rendering).
