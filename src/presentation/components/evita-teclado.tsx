import { ViewStyle } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

export type EvitaTecladoProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
};

/**
 * Compensa a abertura do teclado do sistema para que o campo em foco e o
 * botão de ação nunca fiquem cobertos (ACHADO Keyboard Overlap) — um único
 * ponto usado por `FormularioProduto` e por `PainelInferior` (os 5 sheets),
 * em vez de repetir `KeyboardAvoidingView` e seu `behavior` por tela.
 *
 * Usa o `KeyboardAvoidingView` de `react-native-keyboard-controller`, não o
 * nativo do React Native. `automaticOffset` calcula sozinho o deslocamento a
 * partir da posição real do componente na tela, sem medir
 * `keyboardVerticalOffset` na mão — mas só existe a partir da 1.21 e nunca
 * foi validado pela lib dentro de um `<Modal>` do RN, que abre janela nativa
 * separada e fica fora do alcance do `KeyboardProvider` da raiz. Por isso os
 * sheets não usam mais `<Modal>`: `PainelInferior` renderiza sobre o
 * teclado com `OverKeyboardView`, na mesma janela (correcao-teclado-em-sheets).
 */
export function EvitaTeclado({ children, style, testID }: EvitaTecladoProps) {
  return (
    <KeyboardAvoidingView
      testID={testID}
      behavior="padding"
      automaticOffset
      style={[{ flex: 1 }, style]}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
