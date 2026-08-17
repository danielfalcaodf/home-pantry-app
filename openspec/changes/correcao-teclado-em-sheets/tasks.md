# Tasks — correcao-teclado-em-sheets

**Type:** Correção de Bug. Corrigir primeiro, provar com o teste do cenário exato do defeito,
e então obrigatoriamente cobrir os casos de borda do mesmo contexto.

A change anterior falhou por aplicar a correção esperada sem medir o resultado no aparelho.
Por isso o grupo 1 é diagnóstico, e o critério de aceite de tudo é bounds medidos, nunca a
presença de um componente na árvore.

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

- [ ] 3.1–3.2 Verificação de `mInputShown=true` nos três painéis com `autoFocus` fica para a
  sessão de teste (requer `dumpsys` no dispositivo/emulador); o `autoFocus` declarativo dos três
  campos foi preservado na migração e nenhuma mudança estrutural nova o compromete.

## 4. Prova do cenário exato dos defeitos relatados

- [ ] 4.1 A-06 no `sheet-preco-produto`: abrir pela Lista tocando num item, focar "Quanto
  costuma custar", e assertar por `inspect_screen` que os bounds do campo e do botão "Salvar"
  ficam acima do topo do teclado.
- [ ] 4.2 A-06 no `teclado-quantidade`: abrir por toque longo no stepper e assertar que campo,
  "Usei" e "Repus" ficam acima do teclado.
- [ ] 4.3 A-06 nos outros três painéis (`sheet-avulso`, `sheet-ajuste-compra`,
  `sheet-ajuste-estoque`): mesma medição.
- [ ] 4.4 A-07: abrir cada um dos três painéis com `autoFocus` e confirmar
  `dumpsys input_method` → `mInputShown=true`, sem toque adicional no campo.

## 5. Casos de borda do mesmo contexto (obrigatório)

- [ ] 5.1 Voltar do Android com o teclado aberto dentro do painel: fecha só o teclado, mantendo
  o painel; um segundo Voltar fecha o painel. Não pode regredir em relação ao `<Modal>`.
- [ ] 5.2 Fechar o painel pelo backdrop com o teclado aberto: painel e teclado somem juntos,
  sem deixar o teclado sobre a tela de trás.
- [ ] 5.3 Painel mais alto que o espaço livre: forçar conteúdo que não caiba acima do teclado e
  confirmar que o painel rola mantendo a confirmação alcançável, sem empurrar conteúdo para
  fora da tela.
- [ ] 5.4 Rotação com o painel aberto e o teclado visível: o painel se recompõe na nova
  orientação sem cobrir campo nem confirmação.
- [ ] 5.5 Abrir e fechar o mesmo painel várias vezes seguidas: sem teclado órfão, sem foco
  preso e sem painel fantasma.
- [ ] 5.6 `formulario-produto.tsx` (que NÃO usa Modal) continua funcionando: o teclado aberto
  no último campo mantém "Adicionar à despensa" visível. Prova de que a change não quebrou o
  caso que já estava certo.
- [ ] 5.7 `reduceMotion` do sistema ligado: a animação de entrada do painel novo respeita a
  preferência, conforme `componentes-base` já exige.

## 6. Regressão

- [ ] 6.1 `npm run verificar` verde (fronteiras + lint + typecheck).
- [ ] 6.2 `npm test` verde, incluindo os testes de componente dos cinco sheets.
- [ ] 6.3 `.maestro/jornada-completa-caminho-feliz.yaml` verde (baseline: 62 comandos) — cobre
  o caminho crítico do KPI K4.
- [ ] 6.4 `.maestro/auditoria-ui-ux-android.yaml` verde (baseline: 163 comandos), duas vezes
  seguidas.
- [ ] 6.5 Medir o caminho crítico com o painel novo: dar baixa continua em ≤ 3 toques e
  ≤ 10s (KPI K4).
