## Context

O `<Tabs>` do Expo Router (`app/(tabs)/_layout.tsx`) mantém as telas montadas ao trocar de aba
(comportamento padrão do React Navigation Tabs, só oculta via `display:none`). Sem nenhum
listener de foco/blur, `busca`/`buscaAberta` em `app/(tabs)/index.tsx` nunca resetam. O padrão
correto confirmado via documentação do expo-router é `useFocusEffect` com cleanup rodando no
blur da rota.

## Goals / Non-Goals

**Goals:**
- Trocar de aba sempre fecha o teclado.
- Campo de busca vazio fecha ao trocar de aba; campo com texto mantém o filtro ativo.

**Non-Goals:**
- Não adicionar `unmountOnBlur` no `<Tabs>` global (mudaria comportamento de todas as abas, não
  só a busca).
- Não adicionar `ref` ao `CampoTexto` — fechar `buscaAberta` já desmonta o campo (para o caso
  vazio); para o caso com texto, `Keyboard.dismiss()` sozinho já remove o teclado sem precisar
  de blur programático no input.

## Decisions

- `useFocusEffect` (expo-router) com cleanup no blur: sempre `Keyboard.dismiss()`; fechar
  `buscaAberta` só quando `busca === ''`. Evita o edge case de apagar uma busca em andamento
  que o usuário só queria "pausar" pra checar outra aba.
- Cuidado explícito no efeito para não disparar o cleanup na montagem inicial do componente de
  forma a fechar uma busca que acabou de ser aberta antes da tela ganhar foco pela primeira vez
  — `useFocusEffect` já cobre isso nativamente (roda o efeito no focus, cleanup só no blur
  real).

## Risks / Trade-offs

- [Risco] Nenhum relevante — mudança isolada a 1 arquivo, comportamento aditivo sobre estado já
  existente.
