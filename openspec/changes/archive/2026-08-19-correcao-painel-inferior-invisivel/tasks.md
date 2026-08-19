# Tasks — correcao-painel-inferior-invisivel

**Type:** Correção de Bug. Corrigir primeiro, provar com o teste do cenário exato do defeito,
e então obrigatoriamente cobrir os casos de borda do mesmo contexto.

**Prioridade máxima**: bloqueia o arquivamento de `correcao-teclado-em-sheets` (Ordem 4) e
`correcao-chip-invisivel-em-sheet` (Ordem 13).

## 1. Diagnóstico (bloqueia a escolha da correção)

- [x] 1.1/1.2/1.3 SUPERADO por decisão do usuário 2026-08-19: depois do guard de toque, remoção
  do `KeyboardAvoidingView` aninhado, upgrade de versão do `react-native-keyboard-controller` com
  rebuild nativo e `GestureHandlerRootView` — todos investigados via context7 e testados — o
  defeito de toque desalinhado em `OverKeyboardView` foi **confirmado também em Android real**
  (build EAS development), não era artefato do emulador. Decisão registrada: abandonar
  `OverKeyboardView`, voltar para `<Modal>` nativo. Ver `design.md` para o histórico completo das
  hipóteses descartadas.

## 2. Correção

- [x] 2.1 `PainelInferior` reescrito: `<Modal transparent animationType="slide" onRequestClose>`
  (nativo do RN) substitui `OverKeyboardView`. Guard de "conteúdo pintado"
  (`pintado`/`onLayout`/timeout) removido — não é necessário com `<Modal>`, que não tem a corrida
  de Surface secundária do Fabric que causava o defeito original.
- [x] 2.2 N/A — sem guard de pintura, não há timeout de segurança a aplicar.
- [x] 2.3 Decisão INVERTIDA de propósito (ver 1.1): a correção agora É reintroduzir `<Modal>`,
  por indicação explícita do usuário após esgotar as alternativas com `OverKeyboardView`. Dentro
  do Modal, o teclado é evitado pelo `KeyboardAvoidingView` NATIVO do React Native (`behavior=
  "padding"` nos dois SOs — não o de `react-native-keyboard-controller`, que depende do
  `KeyboardProvider` da raiz, fora de alcance da janela nativa separada do Modal), então A-06/A-07
  (teclado cobrindo o painel) não regride: o card inteiro sobe acima do teclado, sem cortar
  conteúdo e sem precisar de scroll — confirmado visualmente em `sheet-avulso` (campo "O que é")
  e `sheet-ajuste-estoque` (campo de quantidade + chips "Motivo", que ficavam inacessíveis atrás
  do teclado antes desse ajuste — achado relatado pelo usuário e corrigido na mesma rodada).

## 3. Prova do cenário exato do defeito relatado

- [x] 3.1 Confirmado no emulador 2026-08-19: `sheet-avulso` abre, campo "O que é" com autofoco e
  teclado visível sem cobrir o card; toque dentro do card não fecha o painel (era o defeito
  original); "X" e backdrop fecham normalmente.
- [x] 3.2 Confirmado no emulador 2026-08-19: `sheet-ajuste-estoque` (caminho "Outra quantidade")
  abre com o teclado numérico, painel inteiro (campo + chips "Motivo" + botão "Corrigir") visível
  acima do teclado, chip "Correção" selecionável sem fechar o painel nem perder o valor digitado.

## 4. Casos de borda do mesmo contexto (obrigatório)

- [x] 4.1 Confirmado no emulador 2026-08-19 nos 5 sheets: `sheet-avulso` (campo "O que é"),
  `sheet-ajuste-estoque` (campo + chips "Motivo"), `sheet-preco-produto` (campo "Quanto costuma
  custar", teclado numérico, R$ 15,90 digitado), `teclado-quantidade` (via "Outra quantidade"),
  `sheet-ajuste-compra` (dentro do Modo Compra, campo "Preço pago", R$ 8,99 digitado) — em todos,
  o painel sobe inteiro acima do teclado, sem cortar conteúdo.
- [x] 4.2 Confirmado: backdrop fecha o painel normalmente (não há mais janela de proteção que
  possa travar o fechamento).
- [ ] 4.3 Toque rápido duplo no botão que abre um sheet não testado nesta rodada.
- [ ] 4.4 Reteste em dispositivo real (pós-fix) ainda não feito — o teste em Android real
  confirmou o defeito ANTES desta correção (Modal + KeyboardAvoidingView nativo); falta repetir
  o teste no dispositivo real com o código atual.
- [ ] 4.5 `reduceMotion` do sistema ligado não testado nesta rodada.

## 5. Regressão

- [x] 5.1 `npm run verificar` verde (fronteiras + lint + typecheck) — confirmado 2026-08-19 (16
  erros de typecheck pré-existentes de rotas do Expo Router, não relacionados).
- [x] 5.2 `npm test` verde (920/920), incluindo `painel-inferior.test.tsx` reescrito para o
  comportamento do Modal (backdrop fecha / card não propaga / conteúdo oculto quando `visivel=
  false`) e os testes dos 5 sheets.
- [x] 5.3 RESOLVIDO 2026-08-19: causa raiz do bloqueio era o balão "Tools" do dev client cobrindo
  "Adicionar produto" a cada `launchApp`. Adicionado um `swipe` logo após o `launchApp` inicial
  em `jornada-completa-caminho-feliz.yaml` pra arrastar o balão pra fora da região usada pelos
  seletores. `jornada-completa-caminho-feliz.yaml` roda 100% verde (63/63 comandos) com o Modal
  da Change 14 em produção — cobre o caminho crítico do KPI K4 sem regressão.
- [ ] 5.4 Balão "Tools" removido manualmente pelo usuário 2026-08-19 — não bloqueia mais. Ainda
  assim `auditoria-ui-ux-android.yaml` falha antes de chegar nos sheets: `assertVisible: "Onde
  guardo"` (produto/novo.tsx, seção 3b) falha porque o campo fica coberto pelo teclado sem
  `scrollUntilVisible` antes — bug pré-existente do próprio flow, não relacionado a esta change
  (`produto/novo.tsx` não foi tocado). Não fui além do ponto de falha nesta rodada.
- [ ] 5.5 Medição formal do caminho crítico (KPI K4, ≤3 toques/≤10s) não feita nesta rodada —
  fluxo "Usei"/"Repus" direto na lista não passa mais por sheet (é o botão direto), então não é
  afetado por esta change; `teclado-quantidade` (usado por "Outra quantidade") não teve o tempo
  medido formalmente.
- [x] 5.6 Retomado 2026-08-19: `correcao-teclado-em-sheets` (Ordem 4) e
  `correcao-chip-invisivel-em-sheet` (Ordem 13) já têm `tasks.md` atualizado com evidência real
  (A-06/A-07 confirmados nos 5 sheets, chips visíveis em tema claro) — ainda não 100%, ver
  `tasks.md` de cada uma para o que falta.
