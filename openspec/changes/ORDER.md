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

Changes 3 a 8 (rodada de bugs de teste manual + melhorias de usabilidade, 2026-08-20):
implementadas numa **única branch** (`fix/3-8-correcao-bugs-ux-consolidado`, a partir de
`develop`) com **1 commit de código por change** na Fase 1, testadas todas juntas na Fase 2, e
arquivadas para **1 único PR consolidado** (não 1 PR por change, exceção combinada com o
usuário para esta rodada) — desvio pontual da regra de "branch/PR por change" de baixo, só
para 3-8. Nenhuma das 6 changes sobrepôs arquivo de código com outra; um overlap real de
**spec** (não de código) apareceu entre as changes 4 e 5 no mesmo requisito de `modo-compra` e
foi resolvido no arquivamento (delta da change 5 atualizado para incorporar a contribuição já
mesclada da change 4, sem perdê-la).

| — | correcao-total-compra-preco-heranca | — | **Reaberta** em 2026-08-20 depois de arquivada: usuário reproduziu manualmente o mesmo sintoma (Modo Compra mostra 0,00) por uma causa raiz diferente (`compra_item.valorEstimadoUnit` obsoleto quando a linha já existia numa compra aberta residual antes do preço do produto ser editado). Fix aplicado no código nesta sessão; 8 cenários de teste Maestro (`.maestro/bug-preco-*.yaml`) escritos mas **não executados** — change permanece aberta até a execução real confirmar todos. | Pendente — execução real do Maestro em sessão futura (tasks.md seção 6). |
