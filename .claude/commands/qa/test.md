---
description: Gera ou estende testes automatizados (Jest ou Maestro) via o subagent test-automator
argument-hint: [arquivo, função ou descrição do que testar]
---

**Antes de invocar**: confirme que `subagent_type: "test-automator"` está disponível (ex. tente a invocação; se a ferramenta responder "agent type not found", o `.claude/agents/test-automator.md` não existe neste worktree — comum quando o diretório atual é um worktree criado para uma PR antiga, cujo branch foi criado antes desse arquivo existir em `qa/plano-de-testes`). Nesse caso:
1. `git worktree list` para achar outro worktree que tenha o arquivo (normalmente o worktree principal, checkout de `qa/plano-de-testes`).
2. `cp <worktree-com-o-arquivo>/.claude/agents/test-automator.md .claude/agents/test-automator.md` no worktree atual (crie `.claude/agents/` se não existir).
3. Repita a invocação do subagent.
4. **Não** `git add`/commit esse arquivo copiado — é só para a subagent tool resolver o `subagent_type` nesta sessão; ele não pertence à mudança sendo testada.

Invoque o subagent `test-automator` (ferramenta de subagente disponível no ambiente — `Task`/`Agent`, `subagent_type: "test-automator"`) para escrever ou estender testes automatizados no projeto Repor.

**Alvo**: $ARGUMENTS

Se `$ARGUMENTS` estiver vazio, pergunte ao usuário o que precisa de cobertura antes de prosseguir — não adivinhe o escopo.

Passe ao subagent, no prompt de invocação:
- O caminho do arquivo ou a descrição da funcionalidade a testar.
- Se já se sabe a camada (`domain`/`infrastructure`/`application`/`presentation`) ou se cabe ao subagent identificar.
- Se é caso de teste Jest (unidade/componente) ou flow Maestro (roteiro de usuário ponta a ponta) — se não estiver claro, deixe o subagent decidir com base no que está sendo testado (lógica pura → Jest; fluxo de tela real → Maestro).
- Lembre o subagent de rodar `npm run verificar` e o teste isolado antes de reportar concluído.

Depois que o subagent retornar, resuma pro usuário: quais arquivos de teste foram criados/alterados, se passaram, e se algo ficou pendente (ex.: precisa de emulador pra confirmar visualmente).
