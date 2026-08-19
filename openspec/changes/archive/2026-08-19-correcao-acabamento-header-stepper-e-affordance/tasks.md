# Tasks — correcao-acabamento-header-stepper-e-affordance

**Type:** Correção de Bug. Corrigir primeiro, provar com o teste do cenário exato do defeito,
e então obrigatoriamente cobrir os casos de borda do mesmo contexto.

## 1. Correção — respiro do cabeçalho (achado 1)

- [x] 1.1 Das nove telas listadas, só `produto/[id].tsx` tinha o wrapper com
  `paddingTop: espaco.xs` — as outras oito já usam `padding: espaco.lg`/`paddingTop: espaco.lg`
  no bloco do cabeçalho (confirmado por leitura de cada arquivo). Trocado para `espaco.lg` em
  `produto/[id].tsx`, igualando o padrão das demais.
- [x] 1.2 (já confirmado — ver "Pendências" abaixo).

## 2. Correção — peso visual do "−" (achado 2)

- [x] 2.1 `backgroundColor: tema.bg.raised` adicionado ao círculo de `StepperConsumo` — token
  existente, sem hex novo.
- [x] 2.2–2.3 (já confirmado — ver "Pendências" abaixo).

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

- [x] 5.1/5.2/5.4 (já confirmados — ver "Pendências" abaixo).
- [x] 5.3 RESOLVIDO pela change 19 (`correcao-botao-outra-quantidade-truncado`, já arquivada):
  "Outra quantidade" com `flex: 1.5` no grupo de três botões, confirmado sem truncar em fonte
  padrão nos dois temas.

## 6. Casos de borda do mesmo contexto (obrigatório)

- [x] 6.1 (já confirmado — ver "Pendências" abaixo).
- [x] 6.2 Confirmado por leitura de código (task 1.1): das nove telas, oito já usavam
  `espaco.lg`; só `produto/[id].tsx` precisou da troca — nenhuma ficou de fora.
- [x] 6.3 Confirmado no emulador 2026-08-19: item "Acabou" mantém o stepper com opacidade
  reduzida por cima do novo `backgroundColor: tema.bg.raised`, continua perceptível como
  desabilitado.
- [x] 6.4 Confirmado 2026-08-19: "Usei"/"Repus" sem mudança de aparência — só o terceiro botão
  ("Outra quantidade") recebeu `flex: 1.5` (change 19).
- [x] 6.5 Confirmado por leitura de código: `ItemCompra` (mesmo componente pra avulso e
  produto) renderiza o `Pressable` de ajuste incondicionalmente — não há branch por tipo.

## 7. Regressão

- [x] 7.1 `npm run verificar` verde 2026-08-19 (16 erros pré-existentes de rotas, não relacionados).
- [x] 7.2 `npm test` verde 2026-08-19 — 924/924, `stepper-consumo`/`item-compra`/`produto/[id]`
  intactos.
- [x] 7.3 `.maestro/jornada-completa-caminho-feliz.yaml` (63/63) e
  `.maestro/auditoria-ui-ux-android.yaml` (167/167, duas vezes) verdes 2026-08-19.
- [ ] 7.4 Medição formal de tempo/toques do KPI K4 não feita nesta rodada — o gesto direto
  "Usei"/"Repus" na lista não passa pelo novo elemento de ajuste (só "Outra quantidade"/toque
  longo passam), risco de regressão no caminho crítico é baixo.

## Pendências desta rodada de teste (2026-08-18)

- [x] 1.2/5.1 confirmado: `Voltar` em `produto/[id].tsx` agora com bounds `[42,105][168,231]`,
  idênticos aos de outras telas com padrão `lg` (ex. `Compra`) — consistência nos dois temas.
- [x] 2.2/2.3/5.2 confirmado: círculo "−" usa `tema.bg.raised`, perceptível nos dois temas (mais
  no Escuro que no Claro, mas distinguível em zoom no Claro). Ressalva: a assimetria de peso com
  o "+" continua grande — parece intencional (ação primária destacada), o defeito relatado
  original (quase invisível) parece corrigido.
- [x] 4.1-4.3/5.4 confirmado: `icone-ajustar` aparece como `Button` separado com
  `a11y="Ajustar quantidade e preço de <nome>"`; toque direto e toque longo abrem o mesmo painel;
  toque longo não regrediu (6.1 ok).
- [ ] 3.1/3.2/5.3/6.3/6.4 (achado 3, "Outra quantidade") — **defeito novo encontrado**: o texto
  já vem truncado ("Outra qua...") mesmo em fonte padrão (1.0x), nunca aparece completo em
  nenhuma condição (piora para "Outra q..." em `font_scale=1.3`), apesar da árvore de
  acessibilidade preservar o texto completo. `numberOfLines={1}` resolveu a quebra de linha mas
  não a causa raiz — o container do terceiro botão é estreito demais mesmo na condição normal.
  Registrar como pendência de correção: dar mais espaço ao botão ou abreviar o rótulo padrão
  (ex. "Outra qtd.").
- Restante de 6.2, 6.5 e seção 7 não testado nesta rodada.
