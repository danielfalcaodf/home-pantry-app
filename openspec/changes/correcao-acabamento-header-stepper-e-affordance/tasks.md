# Tasks — correcao-acabamento-header-stepper-e-affordance

**Type:** Correção de Bug. Corrigir primeiro, provar com o teste do cenário exato do defeito,
e então obrigatoriamente cobrir os casos de borda do mesmo contexto.

## 1. Correção — respiro do cabeçalho (achado 1)

- [x] 1.1 Das nove telas listadas, só `produto/[id].tsx` tinha o wrapper com
  `paddingTop: espaco.xs` — as outras oito já usam `padding: espaco.lg`/`paddingTop: espaco.lg`
  no bloco do cabeçalho (confirmado por leitura de cada arquivo). Trocado para `espaco.lg` em
  `produto/[id].tsx`, igualando o padrão das demais.
- [ ] 1.2 Comparação visual nos dois temas fica para a sessão de teste.

## 2. Correção — peso visual do "−" (achado 2)

- [x] 2.1 `backgroundColor: tema.bg.raised` adicionado ao círculo de `StepperConsumo` — token
  existente, sem hex novo.
- [ ] 2.2–2.3 Conferência de contraste e peso visual lado a lado fica para a sessão de teste.

## 3. Correção — "Outra quantidade" com fonte ampliada (achado 3)

- [x] 3.1 Escolhido `numberOfLines={1}` (trunca com reticências, RN nativo).
- [x] 3.2 `Botao` ganhou prop opcional `numberOfLines` (repassada ao `Texto` interno,
  `undefined` por padrão — nenhum outro botão do app muda de comportamento). Aplicado só em
  "Outra quantidade" (`produto/[id].tsx`). Varredura (`flex: 1` + `Botao` em grupo) encontrou só
  `teclado-quantidade.tsx` ("Usei"/"Repus", rótulos curtos, sem o mesmo risco) — fora do escopo.

## 4. Correção — affordance de ajuste no Modo Compra (achado 4)

- [x] 4.1 Ícone de ajuste de `item-compra.tsx` virou um `Pressable` aninhado com
  `onPress={onAjustar}` — mesma função hoje só em `onLongPress` do `Pressable` pai, seguindo o
  padrão de `produto/[id].tsx`.
- [x] 4.2 Alvo `ALVO_TOQUE_MINIMO` (48×48dp) com `hitSlop`. `Pressable` aninhado no RN resolve o
  toque para o mais interno — não compete com o toque na linha (marcar) nem com o toque longo.
- [x] 4.3 `accessibilityLabel="Ajustar quantidade e preço de {nome}"` — descreve a ação, não um
  ícone mudo.

## 5. Prova do cenário exato dos defeitos relatados

- [ ] 5.1 Screenshot do cabeçalho de `produto/[id].tsx` antes e depois, nos dois temas —
  confirma respiro visível além do inset.
- [ ] 5.2 Screenshot lado a lado do par consumir/repor antes e depois — confirma peso visual
  equivalente.
- [ ] 5.3 Screenshot dos três botões de ação com fonte do sistema no maior nível — confirma
  alinhamento preservado.
- [ ] 5.4 `inspect_screen` no Modo Compra confirmando que o novo elemento de ajuste está
  presente e alcança `onAjustar` sem precisar de toque longo.

## 6. Casos de borda do mesmo contexto (obrigatório)

- [ ] 6.1 Toque longo no Modo Compra continua funcionando após o novo elemento visível ser
  adicionado — não pode regredir.
- [ ] 6.2 As nove telas de cabeçalho empilhado (lista da task 1.1) verificadas uma a uma —
  nenhuma ficou de fora da troca de token.
- [ ] 6.3 Stepper de item zerado (`desabilitado`, `stepper-consumo.tsx:71`) continua
  perceptível como desabilitado mesmo com o novo preenchimento — opacidade reduzida ainda se
  aplica por cima.
- [ ] 6.4 Botões "Usei"/"Repus" (os outros dois do grupo de três) continuam com aparência
  idêntica à atual — a correção do achado 3 não pode vazar para eles.
- [ ] 6.5 Item avulso no Modo Compra (sem produto associado) também ganha o elemento de ajuste
  visível — não é exclusivo de item com produto.

## 7. Regressão

- [ ] 7.1 `npm run verificar` verde (fronteiras + lint + typecheck).
- [ ] 7.2 `npm test` verde, incluindo os testes de componente de `stepper-consumo`,
  `item-compra` e `produto/[id]`.
- [ ] 7.3 `.maestro/jornada-completa-caminho-feliz.yaml` e `.maestro/auditoria-ui-ux-android.yaml`
  verdes ponta a ponta.
- [ ] 7.4 Medir o caminho crítico (KPI K4): o novo peso visual do "−" e o novo elemento no
  Modo Compra não aumentam toques nem tempo do gesto de consumir.
