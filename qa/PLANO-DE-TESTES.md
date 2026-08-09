# Plano de testes faseado — projeto Repor

Índice de estado. Cada linha só é marcada `concluída` quando o arquivo correspondente tem saída real de comando, não texto genérico. Plano completo em `/home/devdaniel/.claude/plans/quero-cria-um-plano-resilient-flute.md`.

**Restrição vigente em toda a execução: nenhuma alteração em código de produção** (`src/`, `app/`, `openspec/`). Só se cria/edita `qa/**`, se versiona ferramental já existente, e se registram achados. Achados nunca são corrigidos aqui — viram change OpenSpec depois.

## Fases

| Fase | Descrição | Estado | Detalhe |
|---|---|---|---|
| F0 | Ambiente e ferramental (sem emulador) | concluída | [qa/fases/F0-ambiente.md](fases/F0-ambiente.md) |
| F1 | Baseline no topo da cadeia | concluída | [qa/fases/F1-baseline-topo.md](fases/F1-baseline-topo.md) |
| F2 | Cadeia incremental por worktree (13 PRs) | concluída | [qa/fases/F2-cadeia-incremental.md](fases/F2-cadeia-incremental.md) |
| F3 | Conformidade com specs OpenSpec | concluída (13/13) | [qa/fases/F3-conformidade-spec.md](fases/F3-conformidade-spec.md) |
| F4 | Smoke no emulador *(requer development build)* | concluída (13/13) | [qa/fases/F4-smoke-emulador.md](fases/F4-smoke-emulador.md) |
| F5 | Fluxos E2E ainda descobertos *(requer F4)* | concluída (5/5) | `qa/fases/F5-fluxos-e2e.md` |
| F6 | KPI e acessibilidade em uso real *(requer F4)* | **desbloqueada, não iniciada** | `qa/fases/F6-kpi-e-acessibilidade.md` |

**F0 concluída** em duas etapas: a estrutura/ferramental nesta sessão, e o `permissions.allow` de `.claude/settings.json` aplicado manualmente pelo usuário (o modo automático bloqueia edição desse arquivo por classificador próprio).

## PRs (F2/F3/F4 — todas concluídas, 13/13)

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
| [ACHADO-029](achados/ACHADO-029.md) | média | F3 (PR 7) | aberto | `SheetAvulso` sem teste — validação de nome obrigatório do avulso nunca exercitada |
| [ACHADO-030](achados/ACHADO-030.md) | média | F3 (PR 7) | aberto | `agrupar-lista.ts` (visão agrupada/contínua por categoria) sem teste |
| [ACHADO-031](achados/ACHADO-031.md) | baixa | F3 (PR 7) | aberto | `use-preferencia-agrupamento.ts` (persistência da preferência) sem teste |
| [ACHADO-032](achados/ACHADO-032.md) | baixa | F3 (PR 7) | aberto | `rodape-total.tsx` (rótulo, contagem, total da lista) sem teste |
| [ACHADO-033](achados/ACHADO-033.md) | baixa | F3 (PR 7) | aberto | `item-lista.tsx` (distinção visual avulso/produto) sem teste |
| [ACHADO-034](achados/ACHADO-034.md) | média | F3 (PR 8) | aberto | Aviso de saída do modo compra é texto estático, não responde ao botão voltar — divergência de implementação |
| [ACHADO-035](achados/ACHADO-035.md) | média | F3 (PR 8) | aberto | `app/compra/[id].tsx` (tela do modo compra) sem nenhum teste |
| [ACHADO-036](achados/ACHADO-036.md) | baixa | F3 (PR 8) | aberto | Campos individuais do movimento de estoque do fechamento sem teste |
| [ACHADO-037](achados/ACHADO-037.md) | baixa | F3 (PR 8) | aberto | Estilo do item marcado e geometria do controle de marcação sem teste |
| [ACHADO-038](achados/ACHADO-038.md) | média | F3 (PR 9) | aberto | `app/(tabs)/configuracoes.tsx` sem nenhum teste de componente |
| [ACHADO-039](achados/ACHADO-039.md) | média | F3 (PR 9) | aberto | Divergência pós-restauração sem link direto para correção em Diagnóstico |
| [ACHADO-040](achados/ACHADO-040.md) | baixa | F3 (PR 9) | aberto | `ExpoSistemaDeArquivos` (adaptador real de share/document-picker/file-system) sem teste |
| [ACHADO-041](achados/ACHADO-041.md) | média | F3 (PR 10) | aberto | `app/produto/[id].tsx` sem teste |
| [ACHADO-042](achados/ACHADO-042.md) | média | F3 (PR 10) | aberto | `app/conferencia.tsx`, `app/diagnostico.tsx`, `app/produto/[id]/historico.tsx` sem teste |
| [ACHADO-043](achados/ACHADO-043.md) | baixa | F3 (PR 10) | aberto | `cor-do-estado.ts` (distinção visual de tipo de movimento) sem teste |
| [ACHADO-044](achados/ACHADO-044.md) | baixa | F3 (PR 10) | aberto | "Verificação não altera dados" do diagnóstico sem teste explícito |
| [ACHADO-045](achados/ACHADO-045.md) | média | F3 (PR 11) | aberto | `resumo.tsx`, `historico.tsx`, `historico/[id].tsx` sem teste |
| [ACHADO-046](achados/ACHADO-046.md) | baixa | F3 (PR 11) | aberto | "Compra finalizada com total zero" sem teste dedicado na agregação mensal |
| [ACHADO-047](achados/ACHADO-047.md) | baixa | F3 (PR 11) | aberto | "Itens não comprados distinguíveis" no detalhe da compra sem teste |
| [ACHADO-048](achados/ACHADO-048.md) | baixa | F3 (PR 12) | aberto | `headerShown: false` e alvo de toque do `BotaoVoltar` sem teste automatizado |
| [ACHADO-049](achados/ACHADO-049.md) | média | F3 (PR 13) | aberto | Botão de voltar estendido a 7 telas novas, sem teste de destino de navegação |
| [ACHADO-050](achados/ACHADO-050.md) | média | F3 (PR 13) | aberto | Reatividade da contagem de chips e acionabilidade do chip zerado sem teste |
| [ACHADO-051](achados/ACHADO-051.md) | baixa | F3 (PR 13) | aberto | Integração da tab bar (ícones + cor por aba) sem teste |
| [ACHADO-052](achados/ACHADO-052.md) | baixa | F3 (PR 13) | aberto | Posição do `RodapeCompra`, métrica do gasto mensal e corte "últimos 4 meses" sem teste |
| [ACHADO-053](achados/ACHADO-053.md) | média | F5 (PR 13) | aberto | Chip "Faltando" do Resumo mostra número diferente (menor) do que a Despensa para os mesmos dados — não soma `critico` |
| [ACHADO-054](achados/ACHADO-054.md) | média | F5 (PR 8) | aberto | Marcar 2 itens em sequência rápida no modo compra pode persistir o item errado como comprado — suspeita, não confirmado |
| [ACHADO-055](achados/ACHADO-055.md) | baixa | F5 (PR 10) | aberto | Campo "Corrigir para" da conferência mostra placeholder indistinguível de valor real; tocar "Corrigir" sem digitar é no-op silencioso |

## Próximo passo

**F3 completa — 13/13 PRs auditadas.** Todos os 13 arquivos `qa/por-pr/PR-01.md` … `PR-13.md` têm seção `## F3`; matriz consolidada e síntese final em `qa/fases/F3-conformidade-spec.md`; 45 achados de lacuna registrados (ACHADO-008 a ACHADO-052), todos `aberto`, prontos para virar changes via `/opsx:propose`. Padrão dominante: lógica de domínio/aplicação/infraestrutura bem coberta; nenhuma tela (`app/**/*.tsx`) tem teste automatizado em todo o repositório — recomenda-se tratar isso como uma única iniciativa de teste de tela/E2E, não 20+ achados avulsos. Única divergência de implementação real encontrada (não apenas lacuna de teste): ACHADO-034 (PR-08).

**F4 concluída em 2026-08-09** (ver `qa/fases/F4-smoke-emulador.md`): emulador `expo-dev` + dev build + Metro ficaram de pé durante toda a campanha; `/qa:smoke-pr` rodou uma PR por vez via loop horário (cron, 1 rodada/hora), cada uma com seção `## F4` em `qa/por-pr/PR-NN.md`, evidências em `qa/por-pr/evidencias/PR-NN/` e comentário de merge-readiness na respectiva PR do GitHub. **Limitação metodológica conhecida e sinalizada em toda rodada**: os testes rodaram sobre o estado acumulado da branch `qa/plano-de-testes` (PRs 1-13 mescladas sequencialmente nela), nunca sobre um checkout isolado do commit de cada PR. Achados fechados nesta fase: nenhum novo — ACHADO-006 e ACHADO-007 (críticos) permanecem `descartado`, confirmados corrigidos no estado acumulado. Gap residual explícito: **nenhuma compra foi fechada em toda a campanha** (decisão deliberada, para não corromper a massa de dados compartilhada entre as 13 rodadas) — o fluxo de fechamento com confirmação de preço tri-state, o `GraficoBarras` e o histórico de compras populado nunca foram exercitados com dados reais.

**F5 em andamento (2026-08-09).** Primeira rodada (`/qa:e2e-pr 8`, ciclo de compra) concluída: `.maestro/ciclo-de-compra.yaml` criado e verde, fechando pela primeira vez em toda a campanha uma compra real (produto Arroz reposto, compra `finalizada`, primeiro registro real em `GraficoBarras`/histórico de compras). Dois achados novos surgiram do próprio processo de construção do flow (não do fluxo em si, mas de inconsistências reais encontradas ao validar passo a passo): ACHADO-053 (chip "Faltando" da Resumo diverge da Despensa) e ACHADO-054 (suspeita de mis-marcação em toques rápidos consecutivos, não confirmada).

Segunda rodada (`/qa:e2e-pr 5`, cadastro de produto) concluída: `.maestro/cadastro-de-produto.yaml` criado e verde via o subagent `test-automator` (desta vez disponível como `subagent_type` — a indisponibilidade relatada na rodada anterior era do worktree usado naquela sessão, não um problema geral; ver correção de YAML do frontmatter em `151e1db`). `mcp__maestro__*` não estava conectado nesta sessão do subagent; a inspeção de hierarquia real foi feita via `maestro hierarchy`/CLI, mantendo o mesmo princípio de nunca aceitar seletor chutado. Nenhum achado novo de comportamento nesta rodada. Efeito colateral permanente no dispositivo de QA: produto "Item Teste QA F5" criado na despensa do `emulator-5554`.

Terceira rodada (`/qa:e2e-pr 9`, backup/restauração) concluída: `.maestro/backup-restauracao.yaml` criado e verde. Aciona de verdade "Fazer backup agora" (grava JSON no cache, share sheet nativo descartado sem escolher destino) e "Restaurar backup" (abre document picker nativo, descartado sem selecionar arquivo) — avança um degrau sobre a F4 (que não tinha acionado nenhum dos dois). Restauração real nunca é completada por decisão deliberada de segurança: não há controle programático confiável do Maestro sobre o Storage Access Framework do Android para navegar até o arquivo certo sem risco; o round-trip idempotente (backup → restaurar o mesmo arquivo → mesma consistência) permanece coberto só em unidade. Nenhum achado novo.

Quarta rodada (`/qa:e2e-pr 10`, conferência) concluída: `.maestro/conferencia-estoque.yaml` criado e verde, cobrindo o caminho "Corrigir" da conferência que a F4 não tinha exercitado (via correção-sem-mudança, escolha deliberada de segurança porque a conferência é retomável e o item sorteado varia a cada execução repetida). Achado novo: ACHADO-055 (baixa) — botão "Corrigir" nasce desabilitado, placeholder indistinguível de valor real, toque sem digitar é no-op silencioso.

Quinta e última rodada (`/qa:e2e-pr 4`, troca de tema) concluída: `.maestro/troca-de-tema.yaml` criado e verde (21 passos), sem achados novos. Confirma em runtime a troca Claro↔Escuro (rótulos reais na UI são "Automático"/"Claro"/"Escuro", não "Despensa"/"Porcelana" como no CLAUDE.md) e a persistência da preferência através de force-stop/reabertura, sem flash de tema errado. Dispositivo devolvido ao estado em que foi encontrado.

**F5 concluída (5/5): ciclo de compra (PR-08), cadastro de produto (PR-05), backup/restauração (PR-09), conferência (PR-10), troca de tema (PR-04).** Total de 5 flows Maestro novos nesta fase, 2 achados de comportamento registrados durante a autoria (ACHADO-053, ACHADO-054 no ciclo de compra; ACHADO-055 na conferência), nenhuma regressão de app encontrada nos demais três. F6 (KPI e acessibilidade) é o próximo passo natural, já desbloqueada.

**F6 desbloqueada, não iniciada.** KPI K4 (baixa em ≤3 toques/≤10s) e acessibilidade ainda não têm nenhuma medição real, só a garantia estrutural do design documentado no `FRONTEND-DESIGN`.
