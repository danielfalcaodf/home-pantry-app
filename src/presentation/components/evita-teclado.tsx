import { ViewStyle } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

export type EvitaTecladoProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
};

/**
 * Compensa a abertura do teclado do sistema para que o campo em foco e o
 * botão de ação nunca fiquem cobertos (ACHADO Keyboard Overlap) — usado por
 * `FormularioProduto` (tela cheia, dentro do `KeyboardProvider` da raiz).
 *
 * Usa o `KeyboardAvoidingView` de `react-native-keyboard-controller`, não o
 * nativo do React Native — `automaticOffset` calcula sozinho o deslocamento
 * a partir da posição real do componente na tela. `PainelInferior` (os 5
 * sheets) NÃO usa este componente: roda dentro de um `<Modal>`, janela
 * nativa separada fora do alcance do `KeyboardProvider`, e usa o
 * `KeyboardAvoidingView` nativo do React Native diretamente por isso
 * (correcao-painel-inferior-invisivel).
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
