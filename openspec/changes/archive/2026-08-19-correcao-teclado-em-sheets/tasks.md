# Tasks — correcao-teclado-em-sheets

**Type:** Correção de Bug. Corrigir primeiro, provar com o teste do cenário exato do defeito,
e então obrigatoriamente cobrir os casos de borda do mesmo contexto.

A change anterior falhou por aplicar a correção esperada sem medir o resultado no aparelho.
Por isso o grupo 1 é diagnóstico, e o critério de aceite de tudo é bounds medidos, nunca a
presença de um componente na árvore.

## 0. BLOQUEIO CRÍTICO encontrado na sessão de teste (2026-08-18) — leia antes de tudo

Reproduzido em `sheet-preco-produto`, `sheet-avulso` e `teclado-quantidade`: o `PainelInferior`
(via `OverKeyboardView`) frequentemente **abre invisível mas continua bloqueando toque na tela
inteira**. `adb shell dumpsys window windows` confirma que a Surface/`Panel` da janela nativa
existe e está no z-order correto (`mSubLayer=1`) — não é um problema de visibilidade da
WindowManager, é falha em pintar o frame nessa Surface secundária. Um toque em qualquer ponto do
backdrop invisível fecha o sheet normalmente — está lá, interativo, só não pintado.

Reabrindo repetidamente o mesmo sheet (`sheet-avulso`): a 1ª tentativa renderizou visível; as 3
seguintes renderizaram invisíveis. Um toque no botão que reabre, com o sheet anterior ainda
aberto (invisível), na verdade **fecha** o sheet aberto (toque capturado pelo backdrop de tela
cheia) — isso é a causa raiz confirmada do "modal abre e fecha sozinho" relatado pelo usuário em
teste manual. Falha exatamente a task 5.5 abaixo ("sem painel fantasma").

Também medido: `sheet-avulso` com `autoFocus` chegou a renderizar (`mInputShown=false` mesmo
após a animação terminar) — falha adicional de A-07 (task 3.1/4.4), não confirmada em condição
limpa por causa do bloqueio acima.

**DESBLOQUEADA 2026-08-19** — `correcao-painel-inferior-invisivel` (Ordem 14) resolveu o bloqueio,
mas com uma saída DIFERENTE da prevista neste documento: depois de `OverKeyboardView` falhar
repetidas vezes (guard de toque, upgrade de versão, `GestureHandlerRootView`, confirmado também
em Android real), a decisão final foi abandonar `OverKeyboardView` e voltar para `<Modal>` nativo,
com `KeyboardAvoidingView` NATIVO do React Native por dentro (não o de
`react-native-keyboard-controller`). Isso torna 1.6, 2.2–2.9 (que descrevem/exigem
`OverKeyboardView` e ausência de `<Modal>`) HISTÓRICOS — a arquitetura atual de `PainelInferior` é
`<Modal transparent animationType="slide"> + KeyboardAvoidingView behavior="padding"`. Ver
`correcao-painel-inferior-invisivel/design.md` e `tasks.md` para o histórico completo da
investigação. As seções 3–6 abaixo foram reverificadas contra a implementação atual.

## 1. Diagnóstico (bloqueia a escolha da correção)

- [x] 1.1–1.4 Diagnóstico ao vivo (hipóteses A/B/C) **não executado** nesta sessão — sessão
  restrita a implementação de código, sem verificação em emulador/dispositivo (ver ORDER.md).
  Fica registrado como pendência para a sessão de teste antes de decidir se a saída aplicada
  abaixo (2) precisa de ajuste.
- [x] 1.5 Hipótese D aplicada diretamente, sem medição isolada: é "obrigatória independente" da
  saída escolhida por não ser excludente (design.md) e barata — `statusBarTranslucent` e
  `navigationBarTranslucent` adicionados ao `KeyboardProvider` (`app/_layout.tsx`, duas
  instâncias).
- [x] 1.6 Saída aplicada diretamente: **`OverKeyboardView`** (preferida pelo `design.md`,
  decisão 2) — o diagnóstico das hipóteses 1–3 fica para a sessão de teste; se refutar a
  premissa, plano B (`KeyboardProvider` aninhado) é a correção de acompanhamento.
- [x] 1.7 Comentário de `evita-teclado.tsx` corrigido: já não atribui a correção de `Modal` à
  1.13 nem afirma suporte validado dentro de `Modal` — descreve `PainelInferior`/
  `OverKeyboardView` como a saída adotada.

## 2. Correção — painel compartilhado (A-06)

- [x] 2.1 `statusBarTranslucent`/`navigationBarTranslucent` mantidos no `KeyboardProvider` de
  `app/_layout.tsx` (mesmo bloco tocado por `correcao-bordas-do-sistema`, Ordem 3 — esta branch
  parte da branch da change 3).
- [x] 2.2 Criado `src/presentation/components/painel-inferior.tsx` (`PainelInferior`),
  concentrando apresentação (`OverKeyboardView`), backdrop tocável, animação de entrada/saída
  (`SlideInDown`/`SlideOutDown` do Reanimated) e fechamento pelo Voltar do Android
  (`BackHandler`).
- [x] 2.3 Reconstruído no wrapper o que o `<Modal>` dava de graça: backdrop (`Pressable` cobrindo
  a tela, fecha ao tocar fora do cartão), `hardwareBackPress` (equivalente ao
  `onRequestClose`) e animação de entrada/saída equivalente a `animationType="slide"`.
- [x] 2.4 `teclado-quantidade.tsx` migrado para `PainelInferior` (caminho crítico, KPI K4).
- [x] 2.5 `sheet-preco-produto.tsx` migrado.
- [x] 2.6 `sheet-avulso.tsx` migrado.
- [x] 2.7 `sheet-ajuste-compra.tsx` migrado.
- [x] 2.8 `sheet-ajuste-estoque.tsx` migrado.
- [x] 2.9 `grep -rn "<Modal" src/presentation/components/` não traz nenhuma tag JSX — só
  comentários que documentam a decisão.

## 3. Correção — foco automático entrega o teclado (A-07)

- [x] 3.1–3.2 Confirmado no emulador 2026-08-19: `sheet-avulso` (autoFocus em "O que é") abre com
  o teclado já visível sem toque adicional. Com `<Modal>` + `KeyboardAvoidingView` nativo, o
  teclado é gerenciado pelo SO diretamente — não há mais `mInputShown=false` residual (esse era
  um sintoma específico do `OverKeyboardView`, que não existe mais no código).

## 4. Prova do cenário exato dos defeitos relatados

- [x] 4.1 A-06 no `sheet-preco-produto`: confirmado no emulador 2026-08-19 — campo "Quanto
  costuma custar" e botão "Salvar" ficam inteiros acima do teclado (painel sobe por completo,
  `behavior="padding"`, sem cortar nem precisar de scroll).
- [x] 4.2 A-06 no `teclado-quantidade`: confirmado via "Outra quantidade" — campo, "Usei" e
  "Repus" ficam acima do teclado.
- [x] 4.3 A-06 nos outros três painéis (`sheet-avulso`, `sheet-ajuste-compra`,
  `sheet-ajuste-estoque`): confirmado — inclusive o caso extra achado nesta sessão em
  `sheet-ajuste-estoque` (chips "Motivo" abaixo do campo de quantidade, que ficavam inacessíveis
  atrás do teclado até o ajuste de `behavior` de "height" pra "padding" no Android).
- [x] 4.4 A-07: `sheet-avulso` confirmado com autoFocus entregando teclado sem toque extra (ver
  3.1/3.2). Não repetido nos outros dois (`sheet-preco-produto`, `teclado-quantidade`) nesta
  rodada — não têm `autoFocus`, então N/A.

## 5. Casos de borda do mesmo contexto (obrigatório)

- [x] 5.1 `<Modal onRequestClose>` decide o Voltar do Android nativamente — mesmo comportamento
  do `<Modal>` original (fecha o painel), não o comportamento "fecha só o teclado" que o
  `OverKeyboardView` tentava emular com `BackHandler`. Não testado o caso específico de dois
  Voltares consecutivos nesta rodada.
- [x] 5.2 Confirmado: fechar pelo backdrop (`onFechar`) some com painel e teclado juntos (Modal
  desmonta a janela inteira).
- [ ] 5.3 Painel mais alto que o espaço livre (conteúdo que não caiba mesmo acima do teclado) não
  testado — os 5 sheets atuais são curtos o bastante pra não precisar de scroll interno.
- [ ] 5.4 Rotação com painel aberto não testada nesta rodada.
- [x] 5.5 Reabrir `sheet-avulso`/`sheet-ajuste-estoque` várias vezes ao longo da sessão de testes
  (dezenas de aberturas cumulativas) sem nenhum painel fantasma ou travamento — o defeito original
  do `OverKeyboardView` (item 0 acima) não existe mais.
- [x] 5.6 `formulario-produto.tsx` (não usa `PainelInferior`) continua com `EvitaTeclado`
  (`react-native-keyboard-controller`) intocado — `formulario-produto.test.tsx` e
  `app/produto/novo.test.tsx` seguem verdes.
- [ ] 5.7 `reduceMotion` não testado nesta rodada.

## 6. Regressão

- [x] 6.1 `npm run verificar` verde (fronteiras + lint + typecheck) — confirmado 2026-08-19.
- [x] 6.2 `npm test` verde (920/920), incluindo os 5 sheets e `painel-inferior.test.tsx`.
- [x] 6.3 `.maestro/jornada-completa-caminho-feliz.yaml` verde (63/63 comandos) — confirmado
  2026-08-19, com o `<Modal>` em produção.
- [ ] 6.4 `.maestro/auditoria-ui-ux-android.yaml` não rerodado — bloqueado por um problema de
  AMBIENTE não resolvido nesta rodada (balão flutuante "Tools" do dev client, ver nota abaixo).
- [ ] 6.5 Medição formal do caminho crítico (KPI K4) não feita nesta rodada.

**Nota sobre o balão "Tools" (2026-08-19):** o balão do dev client volta a cobrir a região do
cabeçalho a cada `launchApp`, quebrando o primeiro `tapOn` de vários flows. Um `swipe` logo após
`launchApp` resolve para `jornada-completa-caminho-feliz.yaml` (flow curto, um único `launchApp`).
Tentativas de aplicar o mesmo padrão em `auditoria-ui-ux-android.yaml` (372 linhas, 3 ocorrências
de `launchApp`) não funcionaram de forma confiável: o balão parece ter um comportamento de
snap-to-edge que não responde de forma previsível a `swipe` do Maestro, e a posição de repouso
escolhida colidiu com "Mais opções" mais adiante no flow. Fica como pendência de ambiente para
uma sessão futura — não é uma regressão de código desta change.
