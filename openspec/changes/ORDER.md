# Ordem de implementação — changes ativas

Registro central da ORDEM cronológica recomendada de `/opsx:apply` entre as changes **ativas**
deste repositório (não arquivadas). Não é um mecanismo do OpenSpec CLI — é convenção deste
projeto, mantida por `/opsx:propose`, `/opsx:update` e `/opsx:archive`, porque não há
isolamento por branch entre changes: duas em andamento ao mesmo tempo podem tocar o mesmo
arquivo (mesma feature em `src/domain|application|infrastructure|presentation`, mesmo
`src/infrastructure/db/schema.ts`/migrations, mesma rota em `app/`) sem que nada avise.

Regras:

- Todos os comandos `opsx` operam sempre sobre as changes **atuais** (ativas) deste registro —
  nunca sobre changes arquivadas.
- Uma change sai desta lista quando é arquivada. Change sem dependência conhecida entra com
  "—" em "Depende de" — ainda assim ocupa uma posição, para deixar claro que não há ordem
  forçada com o que já está na lista.
- A coluna **Ordem** também define o nome da branch do PR criado no arquivamento:
  `feature/<NN>-<nome-da-change>` ou `fix/<NN>-<nome-da-change>` (prefixo conforme o
  `**Type:**` do `proposal.md` da change — Nova Feature → `feature/`, Correção de Bug →
  `fix/`; NN = Ordem com dois dígitos). A branch do PR respeita, obrigatoriamente, a ordem
  cronológica das changes. Título do PR segue a mesma convenção de commit do projeto:
  `feat: <descrição>` / `fix: <descrição>` (ver CLAUDE.md, seção "Fluxo Git").
- Uma change só pode ser arquivada (e virar PR) quando 100% do fluxo de testes de `/opsx:test`
  passa (TDD, QA e testes de contexto do bug, conforme o tipo).

Changes 3 a 13 foram implementadas (`/opsx:apply`) em sessão dedicada só a código, sem rodar o
fluxo de testes (`/opsx:test`) — testes ficam para sessão separada, por change, antes de cada
`/opsx:archive`. Cada change tem sua própria branch curta (`fix/NN-<nome>`), criada a partir de
`develop`, respeitando a coluna "Depende de" desta tabela.

| Ordem | Change | Depende de | Motivo | Testes |
|---|---|---|---|---|
| 1 | correcao-usabilidade-campos-e-botoes | — | Corrige Keyboard Overlap, Error Prevention (correção silenciosa) e Affordance na base compartilhada (CampoTexto, Botao, padrão de Modal dos sheets) — sem dependência de outra change ativa. | Já em `develop` (mergeada antes desta sessão). |
| 2 | correcao-lista-de-compras | 1 | Reaproveita CampoTexto/EvitaTeclado/ícones de affordance entregues pela change 1 (já mergeada em develop) para corrigir scroll ausente, reatividade da Lista de compras, affordance do ajuste de preço no Modo Compra, e adicionar edição de preço direto na Lista. Sem sobreposição de arquivos com a change 1. | Já em `develop` (mergeada antes desta sessão). |
| 3 | correcao-baixa-produto-excluido-da-lista | — | **Reaberta em 2026-08-21** só para o gate de E2E: código já implementado e arquivado no PR consolidado, mas nenhum flow Maestro foi executado. 4 cenários criados em `.maestro/bug-exclusao-produto-*.yaml`, pendentes de execução (um quinto foi descartado: dependia de sair do Modo Compra deixando a compra aberta, fluxo que vai mudar). Mantém o número de ordem original do lote 3-8. | Unitário/infra verde; E2E **pendente** (tasks.md §5). |
| 5 | correcao-sheets-ajuste-sem-autofoco | — | **Reaberta em 2026-08-21**: E2E estava marcado "fora de escopo" (task 3.2). 5 cenários em `.maestro/bug-autofoco-*.yaml`, pendentes de execução, todos exigindo campo focado **e** teclado levantado. | Unitário/RNTL verde; E2E **pendente** (tasks.md §5). |
| 7 | correcao-busca-despensa-persiste-entre-tabs | — | **Reaberta em 2026-08-21**: E2E não rodado; os testes de presentation mockam foco/blur de rota, então o comportamento com Tabs reais nunca foi exercitado. 5 cenários em `.maestro/bug-busca-despensa-*.yaml`. | Unitário/RNTL verde; E2E **pendente** (tasks.md §5). |
| 8 | feature-apagar-todos-os-dados | — | **Reaberta em 2026-08-21**: E2E estava marcado "fora de escopo" (task 5.1) e a integração application→infra (task 4.1) ficou sem cobertura. 5 cenários em `.maestro/feature-apagar-dados-*.yaml`, três deles destrutivos. | Unitário/infra verde; E2E **pendente** (tasks.md §7). |
| 9 | melhorias-usabilidade-modo-compra | — | Consolida três melhorias de uso real no mercado/atacado: escolha explícita para compra aberta, ajuste rápido de quantidade e revisão agrupada de preços no fechamento. Sobrepõe funcionalmente o fluxo E2E pendente da change 3; o cenário antigo será revisto quando esta change for aplicada. | Nova Feature — TDD, integração, E2E Maestro e regressão pendentes. |

Changes 3 a 8 (rodada de bugs de teste manual + melhorias de usabilidade, 2026-08-20):
implementadas numa **única branch** (`fix/3-8-correcao-bugs-ux-consolidado`, a partir de
`develop`) com **1 commit de código por change** na Fase 1, testadas todas juntas na Fase 2, e
arquivadas para **1 único PR consolidado** (não 1 PR por change, exceção combinada com o
usuário para esta rodada) — desvio pontual da regra de "branch/PR por change" de baixo, só
para 3-8. Nenhuma das 6 changes sobrepôs arquivo de código com outra; um overlap real de
**spec** (não de código) apareceu entre as changes 4 e 5 no mesmo requisito de `modo-compra` e
foi resolvido no arquivamento (delta da change 5 atualizado para incorporar a contribuição já
mesclada da change 4, sem perdê-la).

**Reabertura de 2026-08-21 (gate de E2E).** Cinco daquelas changes (3, 5, 6, 7 e 8) foram
arquivadas sem o E2E do `/opsx:test` — umas por "não rodado", outras marcadas explicitamente
como "fora de escopo" a pedido. Elas voltaram para a lista de changes ativas, com os números de
ordem originais preservados (a numeração é a mesma do lote 3-8, e por isso a lista pula o 4:
`correcao-total-compra-preco-heranca` continua arquivada, é a única do lote que teve os 8
cenários Maestro executados). O código delas **não muda** — a pendência é só a execução dos
cenários E2E escritos em `.maestro/`, registrados como tasks abertas em cada `tasks.md` e
detalhados em `PLANO-TESTES-E2E-CHANGES-REABERTAS.md`, na raiz do repositório. Cada change só
volta ao arquivo quando seus flows passarem no emulador.

