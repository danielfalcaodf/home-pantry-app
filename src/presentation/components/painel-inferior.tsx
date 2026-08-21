import { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleProp, View, ViewStyle } from 'react-native';

import { raio } from '../theme/espaco';
import { useTheme } from '../theme/provider';

export type PainelInferiorProps = {
  visivel: boolean;
  onFechar: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Disparado pelo `Modal` nativo só depois que o painel terminou de
   *  aparecer — ver comentário abaixo sobre por que o foco do primeiro
   *  campo precisa esperar esse callback em vez de `autoFocus` na montagem. */
  onAberto?: () => void;
};

/**
 * Painel deslizante compartilhado pelos sheets do app, sobre `<Modal>`
 * nativo. `OverKeyboardView` (react-native-keyboard-controller) foi tentado
 * antes (correcao-teclado-em-sheets) mas expôs um bug de toque nunca
 * resolvido — toques no card caíam no backdrop em vez do próprio card,
 * confirmado tanto no emulador quanto em Android real
 * (correcao-painel-inferior-invisivel). `<Modal>` é a implementação
 * conhecida-estável: por dentro usa o `KeyboardAvoidingView` NATIVO do React
 * Native (não o de react-native-keyboard-controller) — o `Modal` abre janela
 * nativa própria, fora do alcance do `KeyboardProvider` da raiz, mas o
 * `KeyboardAvoidingView` nativo não depende desse provider (escuta os
 * eventos de teclado do SO direto), então evita o teclado corretamente
 * mesmo dentro da janela separada do Modal.
 *
 * `onAberto` (chamado a partir do `onShow` nativo do `Modal`, disparado só
 * depois que a janela terminou de aparecer): é o gatilho certo para focar
 * um campo de texto e levantar o teclado, em vez de `autoFocus` no
 * `TextInput`, cujo `.focus()` roda na montagem — antes da janela do
 * `Modal` estar de fato anexada no Android, então o campo fica com foco
 * lógico sem abrir o teclado. Mas o próprio `onShow` não basta: medido no
 * emulador, chamar `.focus()` direto nele ainda falha — a janela reporta
 * "aparecida" antes do Android terminar de conceder foco de input pra ela,
 * então `showSoftInput` é ignorado silenciosamente. Um atraso pequeno
 * (`ATRASO_FOCO_APOS_ABRIR_MS`) depois do `onShow` resolve — confirmado com
 * teste manual repetido no emulador; é heurística de timing, não uma
 * condição observável (RN não expõe um evento "janela pronta pra IME" no
 * Android), então pode precisar ajuste se aparecer flakiness em campo
 * (bug e correção documentados em correcao-sheets-ajuste-sem-autofoco).
 *
 * `behavior="padding"` nos dois SOs (não só no iOS, como sugere o exemplo
 * padrão da doc): o card fica ancorado embaixo pelo `justifyContent:
 * 'flex-end'` do backdrop, sem `flex:1` próprio — "padding" adiciona espaço
 * abaixo do card do tamanho do teclado, empurrando o card inteiro pra cima
 * intacto. "height" (usado só pra formulário de tela cheia, com `flex:1`)
 * encolheria a altura do card em vez de deslocá-lo, cortando o conteúdo de
 * baixo — não é isso que o sheet precisa: ele deve ficar inteiro visível
 * acima do teclado, sem scroll (achado relatado em Android real).
 */
const ATRASO_FOCO_APOS_ABRIR_MS = 100;

export function PainelInferior({ visivel, onFechar, children, style, testID, onAberto }: PainelInferiorProps) {
  const tema = useTheme();

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="slide"
      onRequestClose={onFechar}
      onShow={onAberto ? () => setTimeout(onAberto, ATRASO_FOCO_APOS_ABRIR_MS) : undefined}
      statusBarTranslucent
    >
      <Pressable
        onPress={onFechar}
        accessibilityLabel="Fechar"
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <KeyboardAvoidingView behavior="padding">
          <View testID={testID}>
            <Pressable onPress={() => {}}>
              <View
                style={[
                  {
                    backgroundColor: tema.bg.raised,
                    borderTopLeftRadius: raio.sheet,
                    borderTopRightRadius: raio.sheet,
                  },
                  style,
                ]}
              >
                {children}
              </View>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
