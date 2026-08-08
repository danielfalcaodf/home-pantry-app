## F4 — Smoke no emulador

**Estado: desbloqueada** em 2026-08-08. Bloqueio original (`eas login` + development build) foi removido — verificado nesta sessão, sem rodar os smoke tests em si.

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
7. App abre normalmente: `adb shell monkey -p com.triasoftware.repor -c android.intent.category.LAUNCHER 1` → `topResumedActivity=...DevLauncherActivity`. Screenshot confirma a tela padrão do Expo Dev Client ("Repor — Development Build", campo para conectar em `npx expo start`).

## O que falta para rodar os smoke tests de fato

Só falta subir o Metro (`npm start` ou `npx expo start --dev-client`) e conectar o dev client rodando no emulador — a partir daí, `/qa:smoke-pr` pode rodar normalmente PR a PR. Nada de infraestrutura falta.

## Nota para a próxima sessão que rodar F4

- Usar `-no-qt` (não `-no-window`) para o emulador subir headless neste ambiente.
- O APK de debug já existe em `android/app/build/outputs/apk/debug/app-debug.apk`, mas é artefato local (gitignored) — se não existir mais (build limpo, novo checkout), rodar `npx expo run:android` ou `eas build --profile development --platform android` para gerar um novo antes de instalar.
- Emulador demora ~3 min para completar o boot neste ambiente (swiftshader/software rendering).
