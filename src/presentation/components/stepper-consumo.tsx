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
const OPACIDADE_ZERADO = 0.35;

export type StepperConsumoProps = {
  /** Rótulo do leitor de tela com a ação completa, nunca só "menos". */
  rotuloAcessivel: string;
  desabilitado?: boolean;
  onRegistrar: () => void;
  onAbrirTeclado?: () => void;
};

/**
 * O gesto que decide o produto (KPI K4): toque simples registra uma unidade,
 * sem confirmação, sem navegação e sem indicador de carregamento. O háptico
 * sai no instante do toque, antes de qualquer resposta do banco.
 */
export function StepperConsumo({
  rotuloAcessivel,
  desabilitado,
  onRegistrar,
  onAbrirTeclado,
}: StepperConsumoProps) {
  const tema = useTheme();
  const escala = useSharedValue(1);

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [{ scale: escala.get() }],
  }));

  function tocar() {
    if (desabilitado) {
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // get/set em vez de .value: é a API que o React Compiler reconhece.
    escala.set(
      withTiming(ESCALA_PRESSIONADO, { duration: DURACAO_CONTRACAO / 2 }, () => {
        escala.set(esmaecer(1));
      }),
    );
    // A persistência não espera a animação terminar.
    onRegistrar();
  }

  return (
    <Pressable
      onPress={tocar}
      onLongPress={desabilitado ? undefined : onAbrirTeclado}
      disabled={desabilitado}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel}
      accessibilityState={{ disabled: Boolean(desabilitado) }}
      style={{
        width: ALVO_TOQUE_MINIMO,
        height: ALVO_TOQUE_MINIMO,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: desabilitado ? OPACIDADE_ZERADO : 1,
      }}
    >
      <Animated.View
        style={[
          {
            width: DIAMETRO,
            height: DIAMETRO,
            borderRadius: raio.pilula,
            borderWidth: 1,
            borderColor: tema.line.hairline,
            // Preenchido, espelhando o "+" — contorno sozinho competia por
            // invisibilidade ao lado do círculo cheio do repor rápido
            // (correcao-acabamento-header-stepper-e-affordance, achado 2).
            backgroundColor: tema.bg.raised,
            alignItems: 'center',
            justifyContent: 'center',
          },
          estiloAnimado,
        ]}
      >
        <Texto papel="body.lg" tom="secondary">
          −
        </Texto>
      </Animated.View>
    </Pressable>
  );
}
