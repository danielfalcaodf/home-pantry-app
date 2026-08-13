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

| Ordem | Change | Depende de | Motivo |
|---|---|---|---|
| 04 | correcao-chips-de-estado | — (`correcao-fuso-horario-testes` arquivada em 2026-08-09) | Bug crítico de divergência do chip "Faltando" (ACHADO-053, 017, 050); toca `chip-estado.tsx` e `resumo.tsx` |
| 05 | correcao-fluxo-modo-compra | — (`correcao-fuso-horario-testes` arquivada em 2026-08-09) | Bugs médios do modo compra (ACHADO-034, 054) + cobertura da mesma tela (035, 036, 037) |
| 06 | alvos-de-toque-e-acessibilidade | — (`correcao-autofoco-detalhe-produto` arquivada em 2026-08-09; `botao-voltar-conferencia` arquivada em 2026-08-13) | Alvos <48dp e a11y (057-059, 061, 063, 064, 060); toca `produto/[id]` (02) e `conferencia` (03) |
| 07 | configuracoes-e-backup | 06 | Link p/ Diagnóstico pós-restauração (039) + cobertura (038, 040); `configuracoes.tsx` também é tocada por 06 (059, 060) |
| 08 | cobertura-banco-e-migrations | — (`correcao-fuso-horario-testes` arquivada em 2026-08-09) | Dívida de teste de infra/db (004, 005, 011-014, 044); independe da UI |
| 09 | cobertura-componentes-apresentacao | 04, 06 | Testes de componentes (016, 018, 019, 022-028, 043) devem cobrir o comportamento já corrigido de chips/labels |
| 10 | cobertura-lista-e-compra | 05, 06 | Testes de lista/compra (029-033, 046, 047) sobre telas tocadas por 05 e 06 |
| 11 | cobertura-telas-e-navegacao | 06, 07 (`correcao-autofoco-detalhe-produto` arquivada em 2026-08-09; `botao-voltar-conferencia` arquivada em 2026-08-13) | Testes de telas/navegação (041, 042, 045, 048, 049, 051, 052) devem asserir o estado pós-correções |
| 12 | guardas-de-tipo-lint-e-tooling | — | Guardas de tipo/lint e tooling (003, 008-010, 015, 020, 021); não toca código de produto |
