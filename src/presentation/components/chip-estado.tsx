import { Pressable, View } from 'react-native';

import { sobrepor } from '../theme/contraste';
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
  // Fundo do estado ativo: cor do estado com a opacidade do tema, composta
  // sobre o fundo (componentes-base spec, "Chip ativo é distinguível") —
  // nunca `tema.bg.raised`: é a mesma cor de fundo de todo <Modal>/bottom
  // sheet do app, e o chip ativo ficava visualmente idêntico ao fundo do
  // próprio sheet (correcao-chip-invisivel-em-sheet, A-24). Sem `cor`
  // explícita, cai no azulejo — mesma cor de destaque usada em toda ação.
  const fundoAtivo = sobrepor(cor ?? tema.action.azulejo, tema.bg.base, tema.fillOpacity);

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
        backgroundColor: ativo ? fundoAtivo : 'transparent',
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
