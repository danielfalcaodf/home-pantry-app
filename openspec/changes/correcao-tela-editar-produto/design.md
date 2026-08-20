## Context

`produto/novo.tsx` chama `FormularioProduto` com `telaCheia=true` (default), que monta
`View flex:1 > ScrollView flex:1 (próprio scroll) + View fixa de rodapé` — o rodapé fixo
funciona porque o container é `flex:1` isolado. `app/produto/[id].tsx` chama o mesmo
componente com `telaCheia={false}` dentro de um `ScrollView` externo próprio da tela — o
rodapé "fixo" cai dentro desse scroll alheio, sem contexto `flex:1` que o sustente, e por isso
rola junto com o conteúdo. O mesmo problema estrutural explica por que o "scroll to focused
input" nativo do RN não funciona bem ali (o `ScrollView` interno do formulário tem
`scrollEnabled=false`, e o `EvitaTeclado` interno fica sem efeito dentro de um container sem
`flex:1`).

`Botao` hoje só tem duas variantes de cor fixas no tema (`primario`/`secundario`), sem conceito
de ação destrutiva — usado em dezenas de lugares do app, então a extensão precisa ser
estritamente aditiva.

## Goals / Non-Goals

**Goals:**
- Tela de editar produto tem o mesmo comportamento de rodapé fixo e keyboard-avoidance que
  "Novo produto" já tem.
- "Mais opções" rola até o campo revelado, sem dar foco automático.
- Botão de remoção do produto é visualmente reconhecível como ação destrutiva (ícone + cor),
  com rótulo acessível — alinhado à recomendação de HIG (Apple) e Material Design 3 (Google)
  de marcar ações destrutivas com sinal visual redundante, não só posição.

**Non-Goals:**
- Não adotar `@gorhom/bottom-sheet` (está no `package.json` mas não é usado — fora de escopo
  trocar a base de sheets nesta change).
- Não reescrever `EvitaTeclado` — só garantir que ele fica no contexto de layout certo.
- Não mudar a cor de "Tirar da despensa" para hex literal — usar token `state.critico` do
  tema (regra de não ter `#` fora de `tokens.ts`).

## Decisions

- **`telaCheia={true}` em `app/produto/[id].tsx`** em vez de reescrever o mecanismo de rodapé
  fixo do zero: reaproveita a solução que já existe e já funciona em `produto/novo.tsx`, menor
  diff e nenhuma duplicação de lógica de layout.
- **`ref` no `ScrollView` de `formulario-produto.tsx` + scroll manual no toggle "Mais opções"**,
  em vez de depender só do "scroll to focused input" nativo: como nenhum campo recebe foco
  automático nesse fluxo (autoFocus é explicitamente NÃO desejado aqui — só scroll), o
  mecanismo nativo baseado em foco não dispara; precisa de scroll explícito por posição
  (`measureLayout`/`scrollTo`).
- **Extensão aditiva de `Botao`**: nova prop opcional (ícone + cor), variantes
  `primario`/`secundario` existentes continuam bit-a-bit idênticas — nenhuma migração exigida
  nos outros usos do componente.

## Risks / Trade-offs

- [Risco] Maior escopo do lote — mexe em 2 telas + 1 componente base usado amplamente →
  Mitigação: mudança de `Botao` é estritamente aditiva; testes de regressão cobrem as
  variantes antigas explicitamente.
- [Risco] Regressão visual não detectável sem Maestro nesta rodada → Mitigação: teste manual do
  usuário fica para depois desta rodada (fora de escopo, por pedido explícito).
