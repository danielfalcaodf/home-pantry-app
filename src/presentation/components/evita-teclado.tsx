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
 * ponto usado por `FormularioProduto` e pelos 4 sheets, em vez de repetir
 * `KeyboardAvoidingView` e seu `behavior` por tela.
 *
 * Usa o `KeyboardAvoidingView` de `react-native-keyboard-controller`, não o
 * nativo do React Native: o nativo não funciona de forma confiável dentro
 * de `Modal` no Android (o cenário dos 4 sheets desta base) — a lib
 * resolveu isso a partir da 1.13 e é um substituto direto da mesma API.
 * `automaticOffset` calcula sozinho o deslocamento a partir da posição real
 * do componente na tela, sem precisar medir `keyboardVerticalOffset` na mão
 * por causa do cabeçalho/moldura do sheet.
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
