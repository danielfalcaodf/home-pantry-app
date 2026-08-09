import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { corDoEstado, EstadoVisual } from '../theme/cor-do-estado';
import { ESPESSURA_REGUA } from '../theme/espaco';
import { molar } from '../theme/movimento';
import { useTheme } from '../theme/provider';

export type EstadoDoMedidor = EstadoVisual;

export type MedidorNivelProps = {
  /** Já clampada em [0,1] pelo domínio — o componente não faz aritmética. */
  fracao: number;
  estado: EstadoDoMedidor;
  temSobra: boolean;
  /** Sem animação na primeira pintura: a lista não entra em cascata. */
  animar?: boolean;
};

const ESPESSURA_SOBRA = 1;
const FOLGA_SOBRA = 3;

/**
 * A linha d'água: tinta ancorada na base, régua marcando a superfície.
 * Zerado é sem tinta — o vazio é o sinal (FRONTEND §6).
 *
 * A altura é um valor compartilhado do Reanimated: a mola roda na thread de
 * interface, então registrar consumo durante a rolagem não engasga nenhuma
 * das duas. Reatribuir o valor **redireciona** a mola em curso para o novo
 * alvo em vez de reiniciar, que é o que faz toques rápidos parecerem fluidos.
 */
export function MedidorNivel({ fracao, estado, temSobra, animar = true }: MedidorNivelProps) {
  const tema = useTheme();
  const cor = corDoEstado(tema, estado);
  const vazio = fracao <= 0;
  const nivel = useSharedValue(fracao);

  useEffect(() => {
    nivel.set(animar ? molar(fracao) : fracao);
  }, [fracao, animar, nivel]);

  const estiloDaTinta = useAnimatedStyle(() => ({
    height: `${Math.max(nivel.get(), 0) * 100}%`,
  }));

  const estiloDaRegua = useAnimatedStyle(() => ({
    bottom: `${Math.max(nivel.get(), 0) * 100}%`,
  }));

  return (
    <View
      pointerEvents="none"
      // Decorativo: o estado é anunciado pelo rótulo da linha, não aqui.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ ...StyleAbsoluta }}
    >
      <Animated.View
        testID="medidor-tinta"
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: cor,
            opacity: tema.fillOpacity,
          },
          estiloDaTinta,
        ]}
      />
      <Animated.View
        testID="medidor-regua"
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            marginBottom: vazio ? 0 : -ESPESSURA_REGUA,
            height: ESPESSURA_REGUA,
            backgroundColor: cor,
          },
          estiloDaRegua,
        ]}
      />
      {temSobra ? (
        <View
          testID="medidor-sobra"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: FOLGA_SOBRA,
            height: ESPESSURA_SOBRA,
            backgroundColor: cor,
          }}
        />
      ) : null}
    </View>
  );
}

const StyleAbsoluta = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  overflow: 'hidden',
} as const;
