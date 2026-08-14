import { KeyboardAvoidingView, Platform, ViewStyle } from 'react-native';

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
 */
export function EvitaTeclado({ children, style, testID }: EvitaTecladoProps) {
  return (
    <KeyboardAvoidingView
      testID={testID}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
