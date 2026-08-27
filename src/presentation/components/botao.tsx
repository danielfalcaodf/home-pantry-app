import { Pressable, PressableProps, View, ViewStyle } from 'react-native';

import { ALVO_TOQUE_MINIMO, espaco, raio } from '../theme/espaco';
import { NomeDoIcone, icones } from '../theme/icones';
import { useTheme } from '../theme/provider';
import { IconeSvg } from './icone-svg';
import { Texto } from './texto';

export type BotaoProps = Omit<PressableProps, 'style' | 'children'> & {
  titulo: string;
  variante?: 'primario' | 'secundario';
  style?: ViewStyle;
  /** Só para títulos longos em grupos de botões lado a lado (`flex: 1`) —
   *  evita quebra de linha com a fonte do sistema ampliada, sem mudar o
   *  padrão default de nenhum outro botão do app. */
  numberOfLines?: number;
  /** Ícone opcional antes do título — ex.: lixeira em "Tirar da despensa". */
  icone?: NomeDoIcone;
  /**
   * Cor de destaque para ação destrutiva (ícone + texto), ex.: `tema.state.critico`.
   * Sem essa prop, o botão continua exatamente igual às variantes existentes —
   * puramente aditivo, nenhum uso atual de `Botao` muda de aparência.
   */
  corDestrutiva?: string;
};

export function Botao({
  titulo,
  variante = 'primario',
  disabled,
  style,
  numberOfLines,
  icone,
  corDestrutiva,
  ...props
}: BotaoProps) {
  const tema = useTheme();
  const primario = variante === 'primario';
  const corIcone = corDestrutiva ?? (primario ? tema.text.onAction : tema.text.primary);

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
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: espaco.xs,
          backgroundColor: primario ? tema.action.azulejo : tema.bg.raised,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icone ? (
        <View>
          <IconeSvg path={icones[icone]} cor={corIcone} tamanho={18} />
        </View>
      ) : null}
      <Texto
        papel="body.md"
        tom={primario ? 'onAction' : 'primary'}
        cor={corDestrutiva}
        numberOfLines={numberOfLines}
      >
        {titulo}
      </Texto>
    </Pressable>
  );
}
