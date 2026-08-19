**Type:** Correção de Bug

## Why

Usuário relatou em teste manual: "alguns modals não abre, fica automaticamente abre e fecha".
Investigado ao vivo no emulador `emulator-5554` durante a sessão de teste das changes 3-13
(2026-08-18): o `PainelInferior` (`src/presentation/components/painel-inferior.tsx`), componente
compartilhado pelos 5 bottom sheets do app via `OverKeyboardView` (entregue pela change
`correcao-teclado-em-sheets`, Ordem 4), frequentemente **abre invisível mas continua bloqueando
toque na tela inteira**.

Confirmado via `adb shell dumpsys window windows`: a Surface/`Panel` da janela nativa criada pelo
`OverKeyboardView` existe e está no z-order correto (`mSubLayer=1`, acima da activity em
`mSubLayer=0`) — não é um problema de visibilidade da WindowManager, é falha em pintar o frame
nessa Surface secundária. Reproduzido em `sheet-preco-produto`, `sheet-avulso` e
`teclado-quantidade` — este último é o caminho crítico do KPI K4 (dar baixa em ≤3 toques/≤10s).

Um toque em qualquer ponto do backdrop invisível fecha o sheet normalmente — ele está lá,
interativo, só não pintado. Reabrindo o mesmo sheet repetidamente: a 1ª tentativa renderiza
visível, as seguintes ficam invisíveis, e um toque no botão que reabre — com o sheet anterior
ainda "aberto" (invisível) — na verdade **fecha** o sheet que o usuário nunca chegou a ver. É a
causa raiz confirmada do "abre e fecha sozinho": o usuário toca, nada parece acontecer, toca de
novo achando que não registrou, e esse segundo toque fecha o sheet invisível.

Isso é uma regressão mais grave que o bug original que `correcao-teclado-em-sheets` corrigia
(teclado cobrindo o painel) — hoje o painel às vezes nem aparece. Bloqueia a verificação e o
arquivamento de duas changes ativas: `correcao-teclado-em-sheets` (Ordem 4) e
`correcao-chip-invisivel-em-sheet` (Ordem 13), que dependem do mesmo componente e não puderam
ser confirmadas visualmente por causa deste defeito.

## What Changes

- Diagnosticar por que a Surface do `OverKeyboardView` (`react-native-keyboard-controller`) não
  recebe o commit de frame do React Native de forma confiável nesta combinação de
  emulador/arquitetura (candidatos: Fabric vs. Paper, aceleração de hardware da Surface
  secundária, timing entre a animação de entrada do Reanimated e o primeiro frame pintado).
- Corrigir `src/presentation/components/painel-inferior.tsx` para que o sheet só aceite toque
  depois de estar visivelmente pintado — nunca bloquear a tela inteira com um backdrop que ainda
  não renderizou.
- Garantir que abrir o mesmo sheet repetidamente (fechar e reabrir em sequência rápida) nunca
  deixe um painel "fantasma" capturando o próximo toque.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `componentes-base`: novo requirement — painel inferior (bottom sheet) só intercepta toque
  depois de estar visivelmente renderizado; nunca bloqueia a tela com um backdrop invisível.

## Impact

- `src/presentation/components/painel-inferior.tsx` — componente único, usado pelos 5 sheets
  (`sheet-preco-produto.tsx`, `sheet-avulso.tsx`, `teclado-quantidade.tsx`,
  `sheet-ajuste-compra.tsx`, `sheet-ajuste-estoque.tsx`).
- Afeta diretamente o caminho crítico (KPI K4, `teclado-quantidade.tsx`).
- Bloqueia o fechamento de `correcao-teclado-em-sheets` (Ordem 4) e
  `correcao-chip-invisivel-em-sheet` (Ordem 13) até ser resolvida.
