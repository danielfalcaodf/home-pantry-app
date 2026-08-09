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
  `change/<NN>-<nome-da-change>` (NN = Ordem com dois dígitos). A branch do PR respeita,
  obrigatoriamente, a ordem cronológica das changes.
- Uma change só pode ser arquivada (e virar PR) quando 100% do fluxo de testes de `/opsx:test`
  passa (TDD, QA e testes de contexto do bug, conforme o tipo).

| Ordem | Change | Depende de | Motivo |
|---|---|---|---|

_Sem changes ativas no momento._
