import { Pressable, View } from 'react-native';

import { ALVO_TOQUE_MINIMO, espaco, raio } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { Texto } from './texto';

export type ChipEstadoProps = {
  rotulo: string;
  contagem?: number;
  /** Cor vem pronta de quem conhece o estado — o chip não conhece produto. */
  cor?: string;
  ativo?: boolean;
  onPress?: () => void;
};

export function ChipEstado({ rotulo, contagem, cor, ativo, onPress }: ChipEstadoProps) {
  const tema = useTheme();
  const corDaBorda = cor ?? tema.line.hairline;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: Boolean(ativo) } : undefined}
      accessibilityLabel={contagem === undefined ? rotulo : `${rotulo}, ${contagem}`}
      style={{
        minHeight: ALVO_TOQUE_MINIMO,
        paddingHorizontal: espaco.md,
        borderRadius: raio.campo,
        borderWidth: 1,
        borderColor: corDaBorda,
        backgroundColor: ativo ? tema.bg.raised : 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        gap: espaco.sm,
      }}
    >
      <Texto papel="label" cor={cor}>
        {rotulo}
      </Texto>
      {contagem === undefined ? null : (
        <View>
          <Texto papel="data.md" tom="secondary">
            {contagem}
          </Texto>
        </View>
      )}
    </Pressable>
  );
}
