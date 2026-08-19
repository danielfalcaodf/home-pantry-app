# Correção: acabamento de cabeçalho, contraste do stepper e affordance do Modo Compra

**Type:** Correção de Bug

## Why

Quatro defeitos pequenos, de causas diferentes, encontrados na mesma varredura de feedback de
usuário — nenhum sozinho justifica uma change própria, mas juntos formam um lote coerente de
"acabamento visível" que não depende de nenhuma decisão de arquitetura nova.

## What Changes

- **Espaçamento do cabeçalho insuficiente mesmo após os insets do sistema.**
  `app/produto/[id].tsx:191` usa `paddingTop: espaco.xs` (4dp) para o wrapper do
  `BotaoVoltar` — o menor token da escala (`espaco.ts`). Mesmo depois de `correcao-bordas-do-
  sistema` descontar a barra de status, sobra respiro insuficiente no topo, e o botão de
  voltar aparece "colado" mais perto da borda superior do que o resto do app.
- **Botão "−" do stepper de consumo quase invisível.** `StepperConsumo` (`stepper-consumo.tsx`)
  renderiza o "−" como contorno de 1px em `tema.line.hairline` com glifo `tom="secondary"` —
  sem nenhum preenchimento. O par, `BotaoReporRapido` ("+", `botao-repor-rapido.tsx:57-73`), é
  um círculo preenchido com `tema.action.azulejo` e texto de alto contraste. A mesma ação
  (consumo/reposição, os dois lados do KPI K4) tem dois pesos visuais completamente diferentes.
- **Botão "Outra quantidade" quebra o alinhamento com fonte do sistema ampliada.**
  `app/produto/[id].tsx:221-239` renderiza três `Botao` em `flex:1` lado a lado, sem
  `numberOfLines` nem ajuste de tamanho de fonte. "Outra quantidade" é o rótulo mais longo dos
  três — com Dynamic Type grande, quebra linha e destoa visualmente do par.
- **Ajustar preço/quantidade no Modo Compra só existe por toque longo, sem affordance visível.**
  `item-compra.tsx:51` usa só `onLongPress={onAjustar}`. O próprio projeto já resolveu esse
  exato problema em `produto/[id].tsx:219-238` — comentário no código: *"Caminho visível para
  as mesmas ações do toque longo na lista: gesto invisível não pode ser o único acesso
  (FRONTEND §10)"* — adicionando botões visíveis ao lado do gesto. Isso nunca foi replicado no
  Modo Compra.

## Capabilities

### Modified Capabilities

- `componentes-base`: o requisito de alvo de toque/contraste mínimo passa a cobrir também peso
  visual simétrico entre pares de ação (consumo/reposição) e comportamento sob fonte ampliada.
- `chrome-de-navegacao`: o requisito de cabeçalho desenhado no conteúdo ganha um piso mínimo de
  respiro no topo, além do inset do sistema.
- `modo-compra`: o requisito de ajuste de quantidade/preço ganha um caminho visível, não só o
  toque longo — mesmo padrão já exigido no Detalhe do produto.

## Impact

- **Código**: `app/produto/[id].tsx` (padding do cabeçalho e alinhamento dos três botões),
  `src/presentation/components/stepper-consumo.tsx` (peso visual do "−"),
  `src/presentation/components/item-compra.tsx` (affordance visível de ajuste).
- **Dependências**: nenhuma nova — RN nativo (`numberOfLines`/ajuste de fonte) e tokens já
  existentes (`tema.action.azulejo`) resolvem, sem biblioteca nova.
- **Camadas**: só `presentation/`.
- **KPI**: toca o par de botões do K4 (consumo/reposição) só em peso visual, não em gesto —
  sem risco à métrica de toques/tempo.

### Dependências entre changes

Depende de `correcao-bordas-do-sistema` (Ordem 3): o padding do cabeçalho de
`produto/[id].tsx` é ajustado depois de ela aplicar os insets do sistema no mesmo bloco —
ajustar antes seria medir respiro sobre um layout que ainda vai mudar.

Depende de `correcao-nomes-e-estados-acessiveis` (Ordem 8): ambas tocam `item-compra.tsx`
(a 8 nos atributos de acessibilidade do `Pressable` principal, esta na affordance visível de
ajuste) — sequenciada depois para não editar o mesmo arquivo em paralelo. A 8 já depende da 7
(`correcao-agrupamento-modo-compra`), então esta cobre a cadeia completa.
