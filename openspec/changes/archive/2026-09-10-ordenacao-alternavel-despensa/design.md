## Context

`listarDespensa` (`src/infrastructure/repositories/sqlite-produto.repository.ts:191`) ordena
hoje sempre por `CASE (0=crítico, 1=em falta, 2=ok)` + nome. `use-produtos.ts` (hook consumido
pela tela) não reordena — o comentário na linha 53 é explícito: "a ordenação vem do SQL". A
reatividade é via `observadorDoBanco` (listener nativo do `expo-sqlite`): qualquer
`INSERT/UPDATE/DELETE` dispara `recarregar()`, que refaz `listarDespensa` do zero e substitui
`itens` por inteiro. Como o `ORDER BY` reflete o estado *atual*, um item que muda de bucket
durante o gesto de `+`/`-` do stepper aparece imediatamente na nova posição — sem transição, é
troca de array completo seguida de re-render da `FlashList`.

Já existe o padrão de preferência persistida por casa (`ConfiguracaoRepository`,
`src/ports/configuracao.repository.ts`) com um exemplo estruturalmente idêntico ao que este
change precisa: `usePreferenciaDeAgrupamento`
(`src/application/lista/use-preferencia-agrupamento.ts`) — lê no mount, grava e atualiza estado
local em `alternar()`.

## Goals / Non-Goals

**Goals:**
- Seis modos de ordenação da despensa, em três pares critério × direção: `alfabetica` /
  `alfabeticaInversa` (Nome A-Z/Z-A, `alfabetica` é o novo default), `estado` /
  `estadoInverso` (Acabou/Cheio primeiro), `quantidade` / `quantidadeInversa` (Menor/Maior
  quantidade). Preço não entra — fora de escopo (ver proposal.md).
- Seleção via menu de ícone entre a busca e o `+`, com preferência persistida por casa.
- Nos modos `estado`/`estadoInverso` e `quantidade`/`quantidadeInversa`, a posição de cada item
  fica congelada durante a permanência na tela — mudanças de quantidade (incluindo as do
  stepper) atualizam os dados de cada item mas não reordenam a lista renderizada. Os dois pares
  precisam do mesmo tratamento porque ambos ordenam por um valor (`estado`, derivado de
  `quantidade_atual`; ou `quantidade_atual` diretamente) que muda a cada gesto do stepper.
- Estado visual (fração/cor/rótulo) de cada item sempre reflete a quantidade real, mesmo com a
  posição congelada.
- Recalcular a ordem congelada apenas no próximo mount da tela (entrar/sair de novo, ou o app
  voltar de background) — nunca em pull-to-refresh manual.

**Non-Goals:**
- Não mudar `listarFaltantes` (lista de compras) nem a lógica de agrupamento por categoria
  (`src/presentation/format/agrupar-despensa.ts`) — ambos continuam consumindo a ordem que
  recebem, sem reordenar por conta própria.
- Não introduzir animação de reordenação (crossfade/drag) — fora do escopo de movimento
  definido em CLAUDE.md para o caminho crítico; o congelamento evita o problema sem precisar de
  transição visual.
- Não persistir/congelar nada nos modos `alfabetica`/`alfabeticaInversa` — a ordem por nome já é
  estável por construção (nome não muda com `+`/`-`), então não há necessidade de snapshot.
- Não adicionar ordenação por preço — decisão consciente, não uma lacuna (ver proposal.md).

## Decisions

### D1 — Parâmetro de modo em `listarDespensa`, não uma segunda query

`listarDespensa` ganha um segundo parâmetro com 6 valores
(`ProdutoRepository.listarDespensa(casaId: string, modo: OrdenacaoDaDespensa): Promise<Produto[]>`),
ramificando apenas a cláusula `.orderBy(...)`:

```ts
const nomeNocase = sql`${tabelaProduto.nome} COLLATE NOCASE`;
const estadoCase = sql`CASE WHEN ... END`; // regra atual, inalterada
const orderBy = {
  alfabetica: [nomeNocase],
  alfabeticaInversa: [desc(nomeNocase)],
  estado: [estadoCase, nomeNocase],
  estadoInverso: [desc(estadoCase), nomeNocase],
  quantidade: [tabelaProduto.quantidadeAtual, nomeNocase],
  quantidadeInversa: [desc(tabelaProduto.quantidadeAtual), nomeNocase],
}[modo];
```

Nome é sempre o desempate secundário (exceto nos dois modos em que ele já é o critério primário)
— consistente com o comportamento já existente no modo por estado.

Alternativa descartada: duas (ou seis) queries separadas — duplicaria o `.select({...})` inteiro
(17 colunas nomeadas explicitamente, requisito já existente na spec `repositorios`) por uma
diferença que é só o `orderBy`. Um parâmetro é a opção mais enxuta e mantém a assinatura pública
em um único método, coerente com o ISP do projeto (uma responsabilidade — "consultar a
despensa" — parametrizada, não seis interfaces).

### D2 — Congelamento é responsabilidade de `use-produtos.ts`, nunca do SQL

O banco não tem como devolver "a mesma ordem de antes" — ele só conhece o estado atual. O
congelamento é um comportamento de sessão de tela, então mora em `application/`:

- `use-produtos.ts` passa a receber o modo ativo (do novo hook `usePreferenciaDeOrdenacao`) como
  parâmetro.
- No **mount** (primeira chamada de `recarregar`), captura `ordemCongelada: string[]` — os `id`
  na ordem que `listarDespensa` devolveu — **somente se o modo pertencer ao par Estado
  (`estado`/`estadoInverso`) ou ao par Quantidade (`quantidade`/`quantidadeInversa`)**:
  `const modoPorEstado = modo === 'estado' || modo === 'estadoInverso'; const modoPorQuantidade
  = modo === 'quantidade' || modo === 'quantidadeInversa';` — congela se `modoPorEstado ||
  modoPorQuantidade`.
- Nas chamadas seguintes de `recarregar` disparadas pelo observador (mesmo mount, sem trocar de
  tela), se o modo estiver em um desses dois pares, os itens são reordenados por essa
  `ordemCongelada` em vez da ordem que a query acabou de devolver — usando um
  `Map<id, ProdutoNaDespensa>` dos dados recém-buscados e iterando a `ordemCongelada`; produto
  sem entrada no map (removido/inativado) é pulado; produto sem entrada na `ordemCongelada`
  (criado durante a sessão) é anexado ao final, respeitando a posição relativa que a query já
  devolveu (a query segue ordenando pelo critério ativo — então o produto novo já "aterrissa"
  perto de onde deveria, mesmo sem entrar no meio do bucket/posição exata).
- Trocar de modo durante a sessão recaptura a `ordemCongelada` na hora — equivalente a um novo
  "mount" para efeito de congelamento — mesmo entre os dois modos do mesmo par (ex.: `estado` →
  `estadoInverso` também recaptura, já que a direção muda a posição relativa dos buckets).
- `ordemCongelada` vive em `useRef` (não `useState`): mudá-la nunca deve, por si, disparar
  re-render — só a chegada de dados novos deve.

Alternativa descartada: congelar no SQL guardando um "índice de última ordem" numa coluna —
violaria a regra do projeto de que campos derivados/estado de UI não são persistidos no banco
(CLAUDE.md, "Campos derivados nunca são persistidos"), e criaria uma segunda fonte de verdade
para algo que é puramente about ordem de renderização de uma sessão de tela.

### D3 — Nova chave `ordenacaoDaDespensa` em `Configuracoes`, hook por cópia do molde existente

```ts
export type OrdenacaoDaDespensa =
  | 'alfabetica'
  | 'alfabeticaInversa'
  | 'estado'
  | 'estadoInverso'
  | 'quantidade'
  | 'quantidadeInversa';
// em Configuracoes: ordenacaoDaDespensa: OrdenacaoDaDespensa;
// em PADROES: ordenacaoDaDespensa: 'alfabetica';
```

Hook `src/application/lista/use-preferencia-ordenacao.ts`, estruturalmente próximo de
`usePreferenciaDeAgrupamento` mas com `selecionar(modo: OrdenacaoDaDespensa): Promise<void>` no
lugar de `alternar()` — 6 modos não cabem numa alternância binária. Lê no mount, `selecionar`
grava e atualiza estado local. Mesma tabela `configuracao` já existente (upsert por `casaId` +
`chave`) — sem migration nova. O hook reexporta o tipo `OrdenacaoDaDespensa` para que
`presentation/`/`app/` não precise importar de `ports/` diretamente (regra de dependência do
CLAUDE.md).

### D4 — Menu de seleção com `react-native-paper`, não `@expo/ui` nem toggle binário

Com 6 modos, um botão de alternância simples deixou de ser suficiente — vira um menu de seleção
entre a lupa e o `+` em `app/(tabs)/index.tsx`.

**Tentativa descartada — `@expo/ui`:** primeira implementação usou `MenuView` de
`@expo/ui/swift-ui`/`@expo/ui/jetpack-compose` (wrapper nativo por plataforma). Funcionou, mas
exigiu rebuild nativo (módulo não é JS puro) e, ao pesquisar customização de cor via Context7,
ficou claro que cada plataforma expõe uma API de cor diferente e limitada (`DropdownMenuItemElementColors`
no Compose, sem equivalente direto no SwiftUI `Menu`) — não dá para garantir os hex exatos de
`tokens.ts` nas duas plataformas com uma API só, e o texto teria que usar a fonte do sistema
(SwiftUI/Compose não aceitam `Archivo`/`IBM Plex`). Isso quebraria a paridade visual entre iOS/
Android e a tipografia fixa do projeto (CLAUDE.md, "Design de UI").

**Decisão adotada — `react-native-paper`:** `Menu`/`Menu.Item` da lib são renderizados em JS
(Portal + `Animated`), não são widgets nativos por plataforma — logo, visual idêntico em iOS e
Android e customizável por `theme`/`contentStyle`/`titleStyle` com os hex exatos de `tokens.ts`
(`bg.surface`, `text.primary`, `text.secondary`, `action.azulejo`). Não precisa de rebuild
nativo (pure JS). Exige um único `<PaperProvider>` envolvendo as rotas em `app/_layout.tsx`
(Portal host + tema) — nenhum outro componente do Paper é adotado no app, só o `<Menu>` de
ordenação; isso é uma exceção pontual à regra de "sem biblioteca de design system pronta"
(CLAUDE.md), documentada ali mesmo.

Estrutura do menu: âncora é um `Pressable`/ícone (`swap-vertical` do `@expo/vector-icons`) entre
a lupa e o `+`. Dentro, 6 `<Menu.Item>` agrupados em 3 pares por `<Divider>` simples — **sem
texto de cabeçalho por grupo** (decisão explícita: "PRODUTO"/"ESTADO"/"QUANTIDADE" como rótulo
de seção foi cogitado e descartado por redundante com o próprio texto de cada item). Rótulos
simétricos por par: `Nome (A-Z)` / `Nome (Z-A)`, `Acabou primeiro` / `Cheio primeiro`, `Menor
quantidade` / `Maior quantidade` — vocabulário reaproveitado dos chips de estado já existentes
(`Acabou`, não "Completo"/"Vazio"). Cada item tem `leadingIcon` (MaterialCommunityIcons,
resolvido automaticamente pelo `Icon` do Paper em projetos Expo): `sort-alphabetical-ascending`/
`-descending` para o par Nome, `gauge-empty`/`gauge-full` para o par Estado, `sort-numeric-ascending`/
`-descending` para o par Quantidade; e `trailingIcon="check"` só na opção atualmente selecionada
(terceiro canal redundante de estado, junto com o ícone e o texto).

**Achado pós-implementação:** o `<Divider>` sem `style` explícito herda a cor default do tema do
próprio `react-native-paper` (não os tokens do projeto) — como só passamos `onSurface`/
`onSurfaceVariant`/`primary` no `theme` do `<Menu>`, o token de cor que o `Divider` de fato lê
(`outlineVariant`) cai no fallback da lib, produzindo uma inconsistência visual entre os dois
divisores do menu (um mais claro que o outro). Corrigido fixando
`style={{ backgroundColor: tema.line.hairline }}` em cada `<Divider>` — mesmo token hairline já
usado em toda borda/divisória do app (`item-despensa.tsx`, `campo-texto.tsx`, etc.), garantindo
os dois divisores idênticos e alinhados ao tema.

Alternativa descartada: manter um botão de alternância binária e adicionar um segundo botão para
o novo par — rejeitada por multiplicar elementos de UI ao lado do caminho crítico (regra do
CLAUDE.md de não competir com o gesto de dar baixa) em vez de consolidar num único ponto de
entrada.

## Risks / Trade-offs

- [Risco] Um produto que muda de nome (raro, via edição) durante a sessão no modo `alfabetica`
  não teria congelamento nenhum — mas isso é aceitável: edição de nome não é um evento do
  caminho crítico (`+`/`-`) e o não-congelamento no modo alfabético é uma decisão deliberada
  (Non-Goals), não uma lacuna.
- [Risco] `ordemCongelada` em `useRef` pode ficar dessincronizada se o componente for
  remontado sem que a tela realmente tenha sido "reaberta" pelo usuário (ex.: fast refresh em
  dev). → Mitigação: comportamento aceitável em dev; em produção, remount só acontece em
  navegação real ou volta de background, que é exatamente o gatilho desejado.
- [Trade-off] Produto criado durante a sessão não entra necessariamente no início/fim exato do
  seu bucket de estado/posição por quantidade (só "perto", pela ordem que a query já devolve) —
  aceitável, pois o requisito do usuário é sobre não *mover* itens existentes, não sobre
  posicionamento perfeito de itens novos.
- [Risco] Trocar de direção dentro do mesmo par (`estado` → `estadoInverso`, ou o equivalente em
  Quantidade) recaptura o congelamento — o usuário vê a lista reordenar uma vez nesse instante.
  Aceitável: é o resultado esperado de escolher explicitamente outra ordenação, diferente do bug
  original (reordenação *não solicitada* durante o stepper).
- [Achado — condição de corrida sob toques muito rápidos no par Quantidade] Disparando toques
  no stepper "+" bem mais rápido que o ritmo humano (sequência automatizada via Maestro, sem
  pausa real entre eles), a posição congelada do par Quantidade se desfaz. Investigação
  descartou a hipótese inicial de que o gatilho fosse um *empate exato* entre os dois valores
  comparados: repetindo o teste com valores que nunca empatam (um item em `kg` fracionado, outro
  em `un` inteiro, cruzando sem nunca serem numericamente iguais) o problema reproduziu do mesmo
  jeito. Também não é resolvido por pausas artificiais dentro de um único flow Maestro (testado
  com até 5s de pausa real — via gesto de arrastar de distância zero, já que Maestro não tem
  comando nativo de espera fixa — entre cada toque): o problema persistiu mesmo assim. Ou seja,
  o gatilho é puramente a **velocidade de execução automatizada em si** (múltiplas transações de
  escrita disparadas em sequência muito mais rápida do que qualquer interação humana real
  produz), não um valor específico. Causa raiz exata não identificada — suspeita mais forte:
  `addDatabaseChangeListener` (usado por `observadorDoBanco`,
  `src/infrastructure/db/observador.ts`) dispara por linha alterada, não por transação; como
  cada toque no stepper grava duas linhas na mesma transação (`UPDATE produto` +
  `INSERT movimento_estoque`, regra do CLAUDE.md), cada toque provavelmente aciona DUAS chamadas
  concorrentes de `recarregar()`, e sob disparo muito rápido essas chamadas sobrepostas podem
  interagir de um jeito que ainda não foi isolado (código de `aplicarOrdemCongelada` em si não
  depende de valores, só dos ids já congelados em `ordemCongeladaRef` — a reversão só se explica
  se essa ref for resetada/recapturada no meio-tempo, ou se `itens` for lido em um estado
  transitório de escrita). Validado com ritmo humano real (pausas de segundos entre toques) por
  dois métodos independentes — teste do usuário e teste manual do agente — em ambos os casos a
  posição ficou congelada corretamente. Não bloqueia esta change: o caminho crítico real (gesto
  humano de dar baixa, com háptico + spring da linha d'água entre toques) não atinge a cadência
  necessária para disparar essa corrida. Como consequência prática, o flow Maestro
  `feature-ordenacao-despensa-quantidade-congelada.yaml` não passa de forma confiável sob
  execução 100% automatizada (mesmo com as mitigações acima) — mantido no repositório como
  documentação executável do cenário e para revalidação manual, mas a garantia de regressão real
  desse comportamento vem do teste determinístico em `hooks.test.ts` (`"modo quantidade"`, com
  repositório fake e observador síncrono) mais a validação manual já registrada aqui. Registrado
  para investigação futura caso reapareça em uso real ou vire bloqueio de CI.

## Migration Plan

Sem migration de schema (reaproveita tabela `configuracao` existente). Rollout é só código:
default muda de `estado` para `alfabetica` na primeira leitura sem preferência gravada — usuário
existente que nunca gravou a chave passa a ver alfabética automaticamente, consistente com "novo
default" pedido na proposta.
