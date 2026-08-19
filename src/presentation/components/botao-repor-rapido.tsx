import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ALVO_TOQUE_MINIMO, raio } from '../theme/espaco';
import { DURACAO_CONTRACAO, ESCALA_PRESSIONADO, esmaecer } from '../theme/movimento';
import { useTheme } from '../theme/provider';
import { Texto } from './texto';

const DIAMETRO = 40;

export type BotaoReporRapidoProps = {
  /** Rótulo do leitor de tela com a ação completa, nunca só "mais". */
  rotuloAcessivel: string;
  onRegistrar: () => void;
  onAbrirTeclado?: () => void;
};

/**
 * Par do StepperConsumo (design system: um botão de repor sempre visível ao
 * lado do de usar). Toque simples soma o passo padrão; toque longo abre o
 * mesmo teclado de quantidade exata do stepper de consumo — sem isso, quem
 * quer repor um valor específico (ex. completar um estoque cheio pra uma
 * quantidade redonda) não tinha como, só editando o produto.
 */
export function BotaoReporRapido({
  rotuloAcessivel,
  onRegistrar,
  onAbrirTeclado,
}: BotaoReporRapidoProps) {
  const tema = useTheme();
  const escala = useSharedValue(1);

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [{ scale: escala.get() }],
  }));

  function tocar() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    escala.set(
      withTiming(ESCALA_PRESSIONADO, { duration: DURACAO_CONTRACAO / 2 }, () => {
        escala.set(esmaecer(1));
      }),
    );
    onRegistrar();
  }

  return (
    <Pressable
      onPress={tocar}
      onLongPress={onAbrirTeclado}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel}
      style={{
        width: ALVO_TOQUE_MINIMO,
        height: ALVO_TOQUE_MINIMO,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={[
          {
            width: DIAMETRO,
            height: DIAMETRO,
            borderRadius: raio.pilula,
            backgroundColor: tema.action.azulejo,
            alignItems: 'center',
            justifyContent: 'center',
          },
          estiloAnimado,
        ]}
      >
        <Texto papel="body.lg" cor={tema.text.onAction} style={{ fontWeight: '600' }}>
          +
        </Texto>
      </Animated.View>
    </Pressable>
  );
}
