## Context

`PainelInferior` (`src/presentation/components/painel-inferior.tsx`) foi introduzido pela change
`correcao-teclado-em-sheets` (Ordem 4) pra substituir o `<Modal>` nativo do RN, que abria numa
janela separada fora do alcance do `KeyboardProvider` da raiz. A saída escolhida foi
`OverKeyboardView` (`react-native-keyboard-controller`), que renderiza numa Surface Android
adicional acima da activity, mas dentro do mesmo processo — em teoria compartilhando o
`KeyboardProvider`.

Na sessão de teste desta rodada (2026-08-18), o padrão observado com `adb shell dumpsys window
windows` foi: a Surface (`Panel:com.danielfalcaodf.repor/...MainActivity`) existe, está no
z-order certo (`mSubLayer=1`) e tem `mSurface` válido — mas o conteúdo React Native não é pintado
nela em boa parte das aberturas. O backdrop (`Pressable` de tela cheia) continua recebendo toque
normalmente, porque ele já existe na árvore nativa independente do commit de frame do RN.

## Goals / Non-Goals

**Goals:**
- Todo sheet aberto pelo usuário fica visível antes de aceitar qualquer toque de fechamento.
- Abrir/fechar o mesmo sheet repetidas vezes em sequência nunca deixa um painel "fantasma"
  bloqueando a tela.
- Preservar o que `correcao-teclado-em-sheets` já resolveu (teclado não cobre o painel) — a
  correção não pode reintroduzir o `<Modal>` nativo nem regredir A-06/A-07.

**Non-Goals:**
- Reescrever a estratégia de teclado dos sheets (isso é escopo da change 4).
- Investigar exaustivamente a causa raiz da falha de pintura da Surface do
  `OverKeyboardView`/Fabric — o objetivo aqui é blindar o comportamento observável (não bloquear
  toque quando invisível), não necessariamente eliminar a causa de renderização se ela vier de
  uma dependência externa (`react-native-keyboard-controller`).

## Decisions (atualizado após investigação — ver nota abaixo)

**Causa raiz real, confirmada em 2026-08-18/19**: não era falha de pintura da Surface em si — era
`EvitaTeclado` (`KeyboardAvoidingView` do `react-native-keyboard-controller`, `behavior="padding"`,
`automaticOffset`) aninhado **dentro** do `OverKeyboardView` (também do RNKC). Dois componentes
nativos do mesmo pacote, cada um com seu próprio worklet Reanimated de posição/medição, competindo
na mesma Surface secundária do Fabric — o conteúdo do sheet nunca chegava a montar (zero filhos
nativos, confirmado em cold start limpo, com e sem a correção original de guard de toque, e mesmo
após upgrade de `react-native-keyboard-controller` 1.21.9 → 1.22.4 com rebuild completo do dev
client). Testado isoladamente: removendo `EvitaTeclado` de dentro do `PainelInferior`, o conteúdo
passa a renderizar de forma confiável — confirmado por screenshot em múltiplas aberturas.
`OverKeyboardView` já é desenhado pra renderizar acima do teclado por definição (é a razão de ele
existir), então o `KeyboardAvoidingView` aninhado era redundante desde o início, não só a causa do
bug. `EvitaTeclado` continua em uso normal em `FormularioProduto` (fora de qualquer
`OverKeyboardView`) — não foi removido do projeto, só do `PainelInferior`.

### Decisions originais (guard de toque — ainda válido, complementar)

- **Guard de toque por estado "montado e visível", não só "montado"**: `PainelInferior` passa a
  rastrear um estado que só fica verdadeiro após o primeiro frame do conteúdo ser efetivamente
  commitado (ex.: callback `onLayout` do card interno, que só dispara depois que o RN mediu e
  pintou o conteúdo real — diferente do backdrop, que é uma `View` simples sem conteúdo
  dependente de medição). Enquanto esse estado for falso, o backdrop não deve responder a toque
  de fechamento (`pointerEvents="none"` no backdrop até `onLayout` do card disparar).
  Alternativa descartada: confiar só em `useEffect` no mount — não captura o caso em que o
  componente montou mas a Surface não pintou (é exatamente o cenário reproduzido).
- **Investigar se a causa é do lado do `OverKeyboardView`/RNKC antes de decidir se a correção
  fica só no guard de toque ou também precisa de um workaround na Surface** (ex.: forçar
  `collapsable={false}` ou revisitar se há uma opção de configuração do
  `react-native-keyboard-controller` para renderização síncrona) — abrir com `context7` a
  documentação da lib para essa investigação antes de escrever código, e registrar a decisão
  final nesta seção via `/opsx:update` se mudar.
- **Não reverter para `<Modal>`**: reverteria o bug original resolvido pela change 4 (teclado
  cobrindo o painel). O guard de toque é aditivo, não uma reversão de arquitetura.

## Risks / Trade-offs

- [Risco] O guard baseado em `onLayout` pode introduzir um atraso perceptível entre o toque que
  abre o sheet e o momento em que ele aceita interação, se a pintura for lenta em aparelhos mais
  fracos → Mitigação: medir o atraso real no emulador/dispositivo antes de fechar a change; se
  for perceptível, considerar um teto de tempo (timeout) que libera o toque mesmo sem
  confirmação de pintura, como estado emergencial de segurança contra travamento permanente.
- [Risco] O guard pode não cobrir 100% dos casos se a causa raiz for mais profunda (ex.: driver
  gráfico específico do emulador AOSP usado neste ambiente) → Mitigação: task de regressão
  específica pede reprodução em pelo menos 10 aberturas consecutivas do mesmo sheet antes de
  considerar resolvido, não só uma verificação pontual.
