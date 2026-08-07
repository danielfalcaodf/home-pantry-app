---
fase: F0
titulo: Ambiente e ferramental (sem emulador)
estado: parcial
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

## O que ficou pendente

- **Item 2 do plano original (permissions.allow em `.claude/settings.json`)**: não foi possível editar esse arquivo nesta sessão — o modo automático do Claude Code bloqueia qualquer edição a `.claude/settings.json` via classificador próprio, independente do conteúdo. As entradas que precisam ser adicionadas manualmente ao `permissions.allow`, para que o fluxo de QA não gere prompt de aprovação a cada execução:
  ```json
  "Bash(npm test:*)",
  "Bash(npm run verificar:*)",
  "Bash(npx jest:*)",
  "Bash(maestro test:*)",
  "Bash(adb devices:*)",
  "Bash(git worktree:*)"
  ```
  **Nota de incidente**: durante a tentativa, uma modificação local pré-existente do usuário nesse mesmo arquivo (bloco `hooks.Stop` chamando `.claude/scripts/notify.sh`) foi descartada por engano via `git checkout --` e precisou ser restaurada manualmente pelo usuário, já que o classificador também bloqueou a tentativa de reversão automática. Ficou resolvido fora desta sessão.
- **Item 3 do plano (receita de worktree)**: documentada abaixo, mas não exercitada nesta fase (fica para F2).

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
- [ ] `npx jest --selectProjects domain` sem prompt de permissão — **não atingido**: depende da edição pendente em `.claude/settings.json` (ver acima).
