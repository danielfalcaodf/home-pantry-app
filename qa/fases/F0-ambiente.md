---
fase: F0
titulo: Ambiente e ferramental (sem emulador)
estado: concluida
---

## Objetivo

Preparar o terreno da PR #14 (`qa/plano-de-testes`, base `feat/ajuste-visual-telas-design-system`) e versionar o ferramental de QA que já existia untracked no repositório.

## O que foi feito

1. **Branch criada**: `qa/plano-de-testes` a partir de `feat/ajuste-visual-telas-design-system` (`f6cb2fb`).
2. **Estrutura `qa/` criada**: `qa/fases/`, `qa/por-pr/`, `qa/achados/`.
3. **Ferramental untracked versionado** (`git add`, ainda não commitado nesta etapa):
   - `.claude/agents/mobile-ux-tester.md`, `qa-expert.md`, `test-automator.md`
   - `.claude/commands/qa/audit.md`, `test.md`, `ux.md`
   - `.claude/scripts/notify.sh`
   - `.maestro/README.md`, `dar-baixa-caminho-critico.yaml`, `smoke-launch.yaml`
   - `.mcp.json`
4. **`pnpm-lock.yaml` e `pnpm-workspace.yaml` deliberadamente NÃO versionados** nesta PR — ver `qa/achados/ACHADO-003.md` (inconsistência de gerenciador de pacotes: `package.json` usa scripts `npm run`, mas há lockfile pnpm untracked).

## O que ficou pendente (resolvido)

- **Item 2 do plano original (permissions.allow em `.claude/settings.json`)**: o modo automático do Claude Code bloqueou a edição desse arquivo por classificador próprio (independente do conteúdo). As 6 entradas foram adicionadas manualmente pelo usuário:
  ```json
  "Bash(npm test:*)",
  "Bash(npm run verificar:*)",
  "Bash(npx jest:*)",
  "Bash(maestro test:*)",
  "Bash(adb devices:*)",
  "Bash(git worktree:*)"
  ```
  Confirmado: `npx jest --selectProjects domain` roda sem prompt de permissão.
  **Nota de incidente (já resolvida)**: durante a tentativa original, uma modificação local pré-existente do usuário nesse mesmo arquivo (bloco `hooks.Stop` chamando `.claude/scripts/notify.sh`) foi descartada por engano via `git checkout --`. O usuário informou que esse hook já estava descontinuado, então não houve perda real.
- **Item 3 do plano (receita de worktree)**: documentada abaixo, exercitada a partir da F2.

## Verificação do ambiente (sem emulador)

- `git worktree list` → só o worktree principal, como esperado antes da F2.
- `adb` presente em `/run/current-system/sw/bin/adb`.
- `maestro` presente em `/home/devdaniel/.local/bin/maestro`.
- AVD `expo-dev` presente em `~/.android/avd/expo-dev.avd` (emulador ainda não testado — isso é F4).

## Receita de worktree (para uso na F2)

```bash
git worktree add ../qa-pr06 change/dar-baixa-caminho-critico
cd ../qa-pr06 && npm ci
npm run verificar && npm test
# preencher qa/por-pr/PR-06.md; registrar achados
cd -
git worktree remove ../qa-pr06
```

Cada rodada usa um diretório próprio (`../qa-pr<NN>`) para não conflitar com o working tree principal, que permanece em `qa/plano-de-testes` durante toda a F2.

## Critério de saída

- [x] `qa/` existe.
- [x] `git worktree list` mostra só o worktree principal (linha de base antes da F2).
- [x] `npx jest --selectProjects domain` sem prompt de permissão.

**F0 concluída.**
