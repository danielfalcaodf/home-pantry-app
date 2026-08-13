**Type:** Bug Fix

## Why

Ao abrir o detalhe de um produto, o campo "O que é" do `FormularioProduto` recebe foco automático e o teclado sobe em ~300ms sobre os botões "Usei"/"Repus" — a ação primária da tela e o caminho de 2 toques do KPI K4 (ACHADO-056, crítico). Toques na posição de "Usei" acertam o IME, há risco de digitação acidental no nome do produto, e pressionar Voltar com o teclado aberto navega de volta à Despensa em vez de fechar só o teclado. O CLAUDE.md proíbe exatamente isso: "nenhum elemento de UI pode competir com esse gesto — sem confirmação, sem navegação extra".

## What Changes

- Remover o foco automático do campo de nome quando o `FormularioProduto` é montado pela tela de detalhe (`app/produto/[id].tsx`) — autofoco continua fazendo sentido apenas no cadastro de produto novo (`app/produto/novo.tsx`), onde digitar o nome é a primeira ação esperada.
- Garantir que Voltar (botão/gesto de sistema) com o teclado aberto feche primeiro o teclado, mantendo o usuário na tela; só um segundo Voltar navega.
- Cobrir os dois comportamentos com testes (cenário exato do bug + bordas do mesmo contexto).

## Capabilities

### New Capabilities
(nenhuma)

### Modified Capabilities
- `cadastro-de-produto`: o requisito "Detalhe e edição do produto" passa a exigir que a abertura do detalhe não roube foco para campo de texto nem invoque teclado, e que Voltar com teclado aberto feche o teclado antes de navegar.

## Impact

- `src/presentation/components/formulario-produto.tsx` — prop/comportamento de autofoco condicionado ao contexto de montagem.
- `app/produto/[id].tsx` — montagem sem autofoco; tratamento de Voltar com teclado aberto.
- `app/produto/novo.tsx` — preserva o autofoco atual (sem regressão no cadastro).
- Nenhum impacto em domínio, banco ou schema.

### Dependencies between changes

Depende de `correcao-fuso-horario-testes` (ORDER.md 01) apenas pelo gate de testes verde — sem sobreposição de arquivos.
