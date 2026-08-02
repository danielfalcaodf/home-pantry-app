import { View } from 'react-native';

import { ESPESSURA_REGUA } from '../theme/espaco';
import { useTheme } from '../theme/provider';

export type EstadoDoMedidor = 'critico' | 'emFalta' | 'ok';

export type MedidorNivelProps = {
  /** Já clampada em [0,1] pelo domínio — o componente não faz aritmética. */
  fracao: number;
  estado: EstadoDoMedidor;
  temSobra: boolean;
};

const ESPESSURA_SOBRA = 1;
const FOLGA_SOBRA = 3;

/**
 * A linha d'água: tinta ancorada na base, régua marcando a superfície.
 * Zerado é sem tinta — o vazio é o sinal (FRONTEND §6).
 */
export function MedidorNivel({ fracao, estado, temSobra }: MedidorNivelProps) {
  const tema = useTheme();
  const cor = tema.state[estado];
  const vazio = fracao <= 0;

  return (
    <View
      pointerEvents="none"
      // Decorativo: o estado é anunciado pelo rótulo da linha, não aqui.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ ...StyleAbsoluta }}
    >
      <View
        testID="medidor-tinta"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          // Zerado: nenhuma tinta, só a régua na base.
          height: vazio ? 0 : `${fracao * 100}%`,
          backgroundColor: cor,
          opacity: tema.fillOpacity,
        }}
      />
      <View
        testID="medidor-regua"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          // A régua fica no topo da tinta; com o item cheio, rente ao topo.
          bottom: vazio ? 0 : `${fracao * 100}%`,
          marginBottom: vazio ? 0 : -ESPESSURA_REGUA,
          height: ESPESSURA_REGUA,
          backgroundColor: cor,
        }}
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
