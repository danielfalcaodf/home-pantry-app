import { ReactNode, useEffect } from 'react';
import { BackHandler, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { OverKeyboardView } from 'react-native-keyboard-controller';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { raio } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { EvitaTeclado } from './evita-teclado';

export type PainelInferiorProps = {
  visivel: boolean;
  onFechar: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Painel deslizante compartilhado pelos sheets do app. Usa `OverKeyboardView`
 * em vez de `<Modal>`: o `Modal` do RN abre janela nativa separada, fora do
 * alcance do `KeyboardProvider` montado na raiz — o teclado do sistema
 * cobria o painel por inteiro (A-06). `OverKeyboardView` renderiza na mesma
 * janela e funciona independente do provider (correcao-teclado-em-sheets).
 */
export function PainelInferior({ visivel, onFechar, children, style, testID }: PainelInferiorProps) {
  const tema = useTheme();

  useEffect(() => {
    if (!visivel) {
      return;
    }
    // Substitui o onRequestClose do <Modal>: OverKeyboardView não fecha
    // sozinho no Voltar do Android.
    const assinatura = BackHandler.addEventListener('hardwareBackPress', () => {
      onFechar();
      return true;
    });
    return () => assinatura.remove();
  }, [visivel, onFechar]);

  return (
    <OverKeyboardView visible={visivel}>
      <Pressable
        onPress={onFechar}
        accessibilityLabel="Fechar"
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <EvitaTeclado style={{ flex: undefined }} testID={testID}>
          <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
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
          </Animated.View>
        </EvitaTeclado>
      </Pressable>
    </OverKeyboardView>
  );
}
