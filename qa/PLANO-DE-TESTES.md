# Plano de testes faseado — projeto Repor

Índice de estado. Cada linha só é marcada `concluída` quando o arquivo correspondente tem saída real de comando, não texto genérico. Plano completo em `/home/devdaniel/.claude/plans/quero-cria-um-plano-resilient-flute.md`.

**Restrição vigente em toda a execução: nenhuma alteração em código de produção** (`src/`, `app/`, `openspec/`). Só se cria/edita `qa/**`, se versiona ferramental já existente, e se registram achados. Achados nunca são corrigidos aqui — viram change OpenSpec depois.

## Fases

| Fase | Descrição | Estado | Detalhe |
|---|---|---|---|
| F0 | Ambiente e ferramental (sem emulador) | concluída | [qa/fases/F0-ambiente.md](fases/F0-ambiente.md) |
| F1 | Baseline no topo da cadeia | concluída | [qa/fases/F1-baseline-topo.md](fases/F1-baseline-topo.md) |
| F2 | Cadeia incremental por worktree (13 PRs) | em andamento | `qa/fases/F2-cadeia-incremental.md` |
| F3 | Conformidade com specs OpenSpec | pendente | `qa/fases/F3-conformidade-spec.md` |
| F4 | Smoke no emulador *(requer development build)* | bloqueada | `qa/fases/F4-smoke-emulador.md` |
| F5 | Fluxos E2E ainda descobertos *(requer F4)* | bloqueada | `qa/fases/F5-fluxos-e2e.md` |
| F6 | KPI e acessibilidade em uso real *(requer F4)* | bloqueada | `qa/fases/F6-kpi-e-acessibilidade.md` |

**F0 concluída** em duas etapas: a estrutura/ferramental nesta sessão, e o `permissions.allow` de `.claude/settings.json` aplicado manualmente pelo usuário (o modo automático bloqueia edição desse arquivo por classificador próprio).

## PRs (F2 — ainda não iniciada)

| PR | Branch | Estado | Checklist |
|---|---|---|---|
| 1 | `change/bootstrap-projeto-expo` | concluída | [qa/por-pr/PR-01.md](por-pr/PR-01.md) |
| 2 | `change/fundacao-dominio` | concluída | [qa/por-pr/PR-02.md](por-pr/PR-02.md) |
| 3 | `change/persistencia-sqlite` | concluída | [qa/por-pr/PR-03.md](por-pr/PR-03.md) |
| 4 | `change/design-system-tema` | concluída | [qa/por-pr/PR-04.md](por-pr/PR-04.md) |
| 5 | `change/despensa-e-cadastro-produto` | concluída (achado crítico) | [qa/por-pr/PR-05.md](por-pr/PR-05.md) |
| 6 | `change/dar-baixa-caminho-critico` | concluída | [qa/por-pr/PR-06.md](por-pr/PR-06.md) |
| 7 | `feature/lista-de-compras` | concluída | [qa/por-pr/PR-07.md](por-pr/PR-07.md) |
| 8 | `feature/modo-compra-e-fechamento` | concluída | [qa/por-pr/PR-08.md](por-pr/PR-08.md) |
| 9 | `feature/backup-restore-json` | concluída | [qa/por-pr/PR-09.md](por-pr/PR-09.md) |
| 10 | `feature/ajuste-e-conferencia-estoque` | concluída | [qa/por-pr/PR-10.md](por-pr/PR-10.md) |
| 11 | `feature/resumo-valores-e-historico` | concluída | [qa/por-pr/PR-11.md](por-pr/PR-11.md) |
| 12 | `feat/correcao-navegacao-nativa` | concluída (achado crítico) | [qa/por-pr/PR-12.md](por-pr/PR-12.md) |
| 13 | `feat/ajuste-visual-telas-design-system` | pendente | `qa/por-pr/PR-13.md` |

## Achados registrados

| ID | Severidade | Fase | Estado | Resumo |
|---|---|---|---|---|
| [ACHADO-001](achados/ACHADO-001.md) | média | F1 | aberto | Fuso horário em `formatarDataDaCompra` |
| [ACHADO-002](achados/ACHADO-002.md) | média | F1 | aberto | Fuso horário em `useGastoMensal` (mesma raiz do 001) |
| [ACHADO-003](achados/ACHADO-003.md) | baixa | F0 | aberto | Inconsistência de gerenciador de pacotes (npm vs pnpm) |
| [ACHADO-004](achados/ACHADO-004.md) | média | F2 (PR 3) | aberto | `backup-pre-migration.ts` sem nenhum teste |
| [ACHADO-005](achados/ACHADO-005.md) | baixa | F2 (PR 3) | aberto | Import não usado em `sqlite-produto.repository.ts:7` |
| [ACHADO-006](achados/ACHADO-006.md) | crítica | F2 (PR 5) | descartado | `npm run verificar` falhava isoladamente na PR 5; corrigido via eslint-disable justificado na PR 6 |
| [ACHADO-007](achados/ACHADO-007.md) | **crítica** | F2 (PR 12) | aberto | `react-native-get-random-values` importado em `app/_layout.tsx` sem estar em `package.json`; `verificar` falha |

## Como executar a próxima rodada

Rodada única de F2: `/qa:run-pr <NN>` (comando ainda não criado nesta sessão — próximo passo). Ver seção "Execução por sessão" do plano-fonte para o formato do `/loop` sem intervalo.
