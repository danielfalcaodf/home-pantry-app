---
description: Gera ou estende testes automatizados (Jest ou Maestro) via o subagent test-automator
argument-hint: [arquivo, função ou descrição do que testar]
---

Invoque o subagent `test-automator` (ferramenta de subagente disponível no ambiente — `Task`/`Agent`, `subagent_type: "test-automator"`) para escrever ou estender testes automatizados no projeto Repor.

**Alvo**: $ARGUMENTS

Se `$ARGUMENTS` estiver vazio, pergunte ao usuário o que precisa de cobertura antes de prosseguir — não adivinhe o escopo.

Passe ao subagent, no prompt de invocação:
- O caminho do arquivo ou a descrição da funcionalidade a testar.
- Se já se sabe a camada (`domain`/`infrastructure`/`application`/`presentation`) ou se cabe ao subagent identificar.
- Se é caso de teste Jest (unidade/componente) ou flow Maestro (roteiro de usuário ponta a ponta) — se não estiver claro, deixe o subagent decidir com base no que está sendo testado (lógica pura → Jest; fluxo de tela real → Maestro).
- Lembre o subagent de rodar `npm run verificar` e o teste isolado antes de reportar concluído.

Depois que o subagent retornar, resuma pro usuário: quais arquivos de teste foram criados/alterados, se passaram, e se algo ficou pendente (ex.: precisa de emulador pra confirmar visualmente).
