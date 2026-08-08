# Plano de testes faseado — projeto Repor

Índice de estado. Cada linha só é marcada `concluída` quando o arquivo correspondente tem saída real de comando, não texto genérico. Plano completo em `/home/devdaniel/.claude/plans/quero-cria-um-plano-resilient-flute.md`.

**Restrição vigente em toda a execução: nenhuma alteração em código de produção** (`src/`, `app/`, `openspec/`). Só se cria/edita `qa/**`, se versiona ferramental já existente, e se registram achados. Achados nunca são corrigidos aqui — viram change OpenSpec depois.

## Fases

| Fase | Descrição | Estado | Detalhe |
|---|---|---|---|
| F0 | Ambiente e ferramental (sem emulador) | concluída | [qa/fases/F0-ambiente.md](fases/F0-ambiente.md) |
| F1 | Baseline no topo da cadeia | concluída | [qa/fases/F1-baseline-topo.md](fases/F1-baseline-topo.md) |
| F2 | Cadeia incremental por worktree (13 PRs) | concluída | [qa/fases/F2-cadeia-incremental.md](fases/F2-cadeia-incremental.md) |
| F3 | Conformidade com specs OpenSpec | em andamento (7/13) | [qa/fases/F3-conformidade-spec.md](fases/F3-conformidade-spec.md) |
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
| 12 | `feat/correcao-navegacao-nativa` | concluída (achado crítico, corrigido na PR 13) | [qa/por-pr/PR-12.md](por-pr/PR-12.md) |
| 13 | `feat/ajuste-visual-telas-design-system` | concluída | [qa/por-pr/PR-13.md](por-pr/PR-13.md) |

## Achados registrados

| ID | Severidade | Fase | Estado | Resumo |
|---|---|---|---|---|
| [ACHADO-001](achados/ACHADO-001.md) | média | F1 | aberto | Fuso horário em `formatarDataDaCompra` |
| [ACHADO-002](achados/ACHADO-002.md) | média | F1 | aberto | Fuso horário em `useGastoMensal` (mesma raiz do 001) |
| [ACHADO-003](achados/ACHADO-003.md) | baixa | F0 | aberto | Inconsistência de gerenciador de pacotes (npm vs pnpm) |
| [ACHADO-004](achados/ACHADO-004.md) | média | F2 (PR 3) | aberto | `backup-pre-migration.ts` sem nenhum teste |
| [ACHADO-005](achados/ACHADO-005.md) | baixa | F2 (PR 3) | aberto | Import não usado em `sqlite-produto.repository.ts:7` |
| [ACHADO-006](achados/ACHADO-006.md) | crítica | F2 (PR 5) | descartado | `npm run verificar` falhava isoladamente na PR 5; corrigido via eslint-disable justificado na PR 6 |
| [ACHADO-007](achados/ACHADO-007.md) | crítica | F2 (PR 12) | descartado | `react-native-get-random-values` importado em `app/_layout.tsx` sem estar em `package.json`; corrigido na PR 13 |
| [ACHADO-008](achados/ACHADO-008.md) | baixa | F3 (PR 1) | aberto | Regras de lint de fronteira (boundaries/hex/import proibido) sem teste automatizado que force a violação |
| [ACHADO-009](achados/ACHADO-009.md) | baixa | F3 (PR 1) | aberto | `Result<T,E>` sem teste de tipo para discriminação obrigatória exigida pelo spec |
| [ACHADO-010](achados/ACHADO-010.md) | baixa | F3 (PR 2) | aberto | `Unidade` sem teste de tipo para conjunto fechado exigido pelo spec (mesma classe do ACHADO-009) |
| [ACHADO-011](achados/ACHADO-011.md) | baixa | F3 (PR 3) | aberto | Conexão de banco (WAL, singleton, escuta de mudanças) sem teste dedicado |
| [ACHADO-012](achados/ACHADO-012.md) | média | F3 (PR 3) | aberto | Fluxo de preparação do banco (`_layout.tsx`) sem teste de sucesso/falha de migration |
| [ACHADO-013](achados/ACHADO-013.md) | média | F3 (PR 3) | aberto | "Aplicação a partir de versão intermediária" agora testável (4 migrations) e ainda sem teste |
| [ACHADO-014](achados/ACHADO-014.md) | baixa | F3 (PR 3) | aberto | Possível divergência de "colunas explícitas" em `listarDespensa` — revisão humana recomendada |
| [ACHADO-015](achados/ACHADO-015.md) | baixa | F3 (PR 4) | aberto | Testes de tipo ausentes para papel inválido (Texto) e tema tipado (mesma classe do ACHADO-009/010) |
| [ACHADO-016](achados/ACHADO-016.md) | média | F3 (PR 4) | aberto | `toast.tsx` sem nenhum teste (substituição, não bloqueio, barra de tempo) |
| [ACHADO-017](achados/ACHADO-017.md) | média | F3 (PR 4) | aberto | `ChipEstado` ativo usa cor neutra em vez da cor do estado com opacidade reduzida — possível divergência de implementação |
| [ACHADO-018](achados/ACHADO-018.md) | média | F3 (PR 4) | aberto | `usePreferenciaDeTemaPersistida` sem teste apesar de repositório injetável |
| [ACHADO-019](achados/ACHADO-019.md) | baixa | F3 (PR 4) | aberto | Comportamento de `reduceMotion` (esmaecimento, retorno tátil) sem teste |
| [ACHADO-020](achados/ACHADO-020.md) | baixa | F3 (PR 4) | aberto | Escala de espaçamento sem lint rule de enforcement (ao contrário de cor) |
| [ACHADO-021](achados/ACHADO-021.md) | baixa | F3 (PR 4) | aberto | Orçamento de bundle de fontes (696KB > 400KB citado no spec) sem medição automatizada |
| [ACHADO-022](achados/ACHADO-022.md) | média | F3 (PR 5) | aberto | `formulario-produto.tsx` sem nenhum teste (campos recolhidos, sugestões de categoria) |
| [ACHADO-023](achados/ACHADO-023.md) | baixa | F3 (PR 5) | aberto | `normalizar-busca.ts` (normalização de acento na busca) sem teste unitário |
| [ACHADO-024](achados/ACHADO-024.md) | baixa | F3 (PR 5) | aberto | Ação "ver item existente" no fluxo de duplicidade sem teste |
| [ACHADO-025](achados/ACHADO-025.md) | baixa | F3 (PR 5) | aberto | Teste de conformidade da linha da despensa não checa ausência de card/borda/sombra |
| [ACHADO-026](achados/ACHADO-026.md) | média | F3 (PR 6) | aberto | Coreografia do gesto (haptics, timing da contração/mola) sem teste de orquestração |
| [ACHADO-027](achados/ACHADO-027.md) | baixa | F3 (PR 6) | aberto | `TecladoQuantidade`: caminho "Repus" (reposição específica) sem teste positivo |
| [ACHADO-028](achados/ACHADO-028.md) | média | F3 (PR 6) | aberto | Prop `animar` de `medidor-nivel.tsx` (animação condicional por item) sem teste |

## Próximo passo

F3 em andamento: PR-01 a PR-11 auditadas (11/13). Próxima PR sem seção `## F3`: **PR-12** (`feat/correcao-navegacao-nativa`). Continuar `/qa:audit-pr` PR a PR até completar as 13. Nota: o subagent `qa-expert` não estava disponível como `subagent_type` nesta sessão — auditoria feita manualmente seguindo a mesma metodologia (ver `qa/fases/F3-conformidade-spec.md`). F4-F6 seguem bloqueadas até `eas login` + development build.
