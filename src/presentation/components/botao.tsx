import { Pressable, PressableProps, ViewStyle } from 'react-native';

import { ALVO_TOQUE_MINIMO, espaco, raio } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { Texto } from './texto';

export type BotaoProps = Omit<PressableProps, 'style' | 'children'> & {
  titulo: string;
  variante?: 'primario' | 'secundario';
  style?: ViewStyle;
};

export function Botao({
  titulo,
  variante = 'primario',
  disabled,
  style,
  ...props
}: BotaoProps) {
  const tema = useTheme();
  const primario = variante === 'primario';

  return (
    <Pressable
      {...props}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      // Pressionado e desabilitado anunciados ao leitor de tela, não só pintados.
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={({ pressed }) => [
        {
          minHeight: ALVO_TOQUE_MINIMO,
          minWidth: ALVO_TOQUE_MINIMO,
          paddingHorizontal: espaco.lg,
          paddingVertical: espaco.md,
          borderRadius: raio.campo,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: primario ? tema.action.azulejo : tema.bg.raised,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Texto papel="body.md" tom={primario ? 'onAction' : 'primary'}>
        {titulo}
      </Texto>
    </Pressable>
  );
}
