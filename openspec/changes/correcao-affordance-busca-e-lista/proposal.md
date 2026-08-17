# Correção de affordance na busca e na Lista

**Type:** Correção de Bug

## Why

A change `correcao-usabilidade-campos-e-botoes` (Ordem 1) deu tratamento de affordance e de
estado à base de componentes — `CampoTexto`, `Botao`, chevron, erro em texto. Duas superfícies
ficaram fora do escopo dela e continuam com os defeitos que ela corrigiu em todo o resto: a
tela de busca (`app/(tabs)/index.tsx`) e o cabeçalho da Lista (`app/(tabs)/lista.tsx`).

Quatro achados, todos da mesma família: um controle não diz em que estado está, ou diz uma
coisa enquanto a tela mostra outra.

## What Changes

- **A-05 — o toggle "Agrupar" não tem nenhum canal visual de estado.**
  `app/(tabs)/lista.tsx:141-152`. O `Pressable` carrega
  `accessibilityState={{ selected: agrupado }}`, mas o `Texto` renderiza idêntico nos dois
  estados: mesma cor (`action.azulejo`), mesmo peso, sem marca, sem inversão de rótulo. Ligado
  e desligado são **pixel a pixel indistinguíveis** — os dois screenshots da auditoria provam
  isso. O estado existe só para o leitor de tela. Viola a regra dos três canais redundantes,
  que aqui não tem nenhum.

  Agrava: "Compartilhar" (ação, sem estado) e "Agrupar" (toggle, com estado) são pintados
  exatamente igual, então nada indica que um dos dois é um interruptor. Comparar com
  `ChipEstado`, que faz certo: borda + cor + contagem + `selected`.

  Nota: `lista-derivada` já exige 48×48dp para esse controle, e isso está cumprido. O que falta
  é o estado ser visível.

- **A-03 — os chips de filtro mantêm a contagem total durante a busca.** Com a busca sem
  resultado, os chips continuam anunciando "Tudo 40 / Acabou 40 / Faltando 40" enquanto a lista
  mostra o estado vazio. Dois elementos da mesma tela se contradizendo.
  (Não confundir com o falso alarme "40/40/40": `faltando = critico + emFalta` é filtro
  composto documentado em `agrupar-despensa.ts:57-74`, correto por design.)

- **A-01 — o estado vazio da busca é centralizado ignorando o teclado.**
  `app/(tabs)/index.tsx` não tem `EvitaTeclado`, ao contrário de `formulario-produto.tsx:100`.
  O bloco vazio é centralizado na região da lista (699→2208, centro 1453,5) — geometricamente
  correto, mas o teclado começa em y=1670. Sobra 59px (22dp) entre o CTA
  (`[240,1485][841,1611]`) e o teclado; com termo de ~73 caracteres a folga cai para ~14dp e o
  CTA encosta visualmente no teclado. O toque ainda funciona: é **risco de margem que
  encolhe**, não oclusão provada.

- **A-02 — o corretor ortográfico sublinha o termo buscado.** O campo de busca mostra
  sublinhado vermelho de spell-check. Nome de produto não é prosa; falta
  `spellCheck={false}` / `autoCorrect={false}`.

- **A-19 — o estado vazio mente sobre a causa quando o vazio vem só de um chip.**
  `app/(tabs)/index.tsx:228-234`: `visiveis.length === 0` dispara sempre o mesmo
  `EstadoVazio`, com `convite={`Nenhum item chamado "${busca}" por aqui.`}` e a ação
  `Cadastrar ${busca}` — mesmo quando `busca === ''` e o vazio veio só de um filtro de chip
  (ex.: "Acabou" numa despensa sem nenhum item nesse estado). O texto renderizado fica
  `Nenhum item chamado "" por aqui.`, e o botão de ação fica `Cadastrar ` (nome vazio,
  `router.push('/produto/novo?nome=')`) — pior que o texto sozinho, é uma ação que cadastra
  produto sem nome. Mesma família do A-03 (elemento da tela que não reflete a causa real do
  estado), aqui no próprio `EstadoVazio` em vez dos chips.

## Capabilities

### Modified Capabilities

- `tela-despensa`: o requisito "Filtro por estado com contagem" passa a exigir que a contagem
  dos chips reflita o conjunto efetivamente exibido, e não o total da despensa, quando há busca
  ativa. O requisito "Busca por nome" ganha o comportamento do campo (sem corretor) e do estado
  vazio com o teclado aberto, e passa a distinguir texto e ação de estado vazio conforme a
  causa real: filtro sem termo buscado versus busca sem resultado (A-19).
- `lista-derivada`: o requisito "Ordenação e agrupamento por categoria" passa a exigir que o
  controle de agrupamento expresse o estado por canais visuais redundantes, não apenas por
  `accessibilityState`.

## Impact

- **Código**: `app/(tabs)/index.tsx` (busca, chips, estado vazio),
  `app/(tabs)/lista.tsx:141-152` (toggle), e o `CampoTexto` usado pela busca.
- **Dependências**: nenhuma nova.
- **Camadas**: `presentation/` e `app/`. A contagem por conjunto filtrado pode tocar
  `src/presentation/format/agrupar-despensa.ts` — que é formatação, não domínio.
- **Design**: a correção do A-05 precisa respeitar a regra dos três canais redundantes de
  `FRONTEND-DESIGN-app-estoque-de-casa.md` e não introduzir hex fora de `tokens.ts`.

### Dependências entre changes

Depende de `correcao-acoes-fora-de-alcance` (Ordem 5) por sobreposição de arquivo: as duas
tocam `app/(tabs)/lista.tsx` — a 5 no `EstadoVazio` (`:113-114`) e no rodapé (`:204-210`), esta
no toggle do cabeçalho (`:141-152`). Não são as mesmas linhas, mas a 5 reorganiza a barra de
ações do cabeçalho onde este toggle vive, então esta vem depois para não conflitar.

Herda o padrão de affordance e de estado estabelecido por
`correcao-usabilidade-campos-e-botoes` (Ordem 1, já em `develop`) — reaproveita, não redefine.
