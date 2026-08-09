import { Text as TextoNativo, TextProps, TextStyle } from 'react-native';

import { PapelTipografico, tipografia } from '../theme/tipografia';
import { useTheme } from '../theme/provider';

type Tom = 'primary' | 'secondary' | 'onAction';

export type TextoProps = Omit<TextProps, 'style'> & {
  papel?: PapelTipografico;
  tom?: Tom;
  cor?: string;
  style?: TextStyle;
};

/**
 * Único caminho para texto no app: aceita só papéis da escala, nunca tamanho
 * ou família arbitrários. É o que impede a escala de derivar item a item.
 */
export function Texto({
  papel = 'body.md',
  tom = 'primary',
  cor,
  style,
  ...props
}: TextoProps) {
  const tema = useTheme();
  const escala = tipografia[papel];
  return (
    <TextoNativo
      {...props}
      style={[
        {
          fontFamily: escala.fontFamily,
          fontSize: escala.fontSize,
          lineHeight: escala.lineHeight,
          letterSpacing: escala.letterSpacing,
          color: cor ?? tema.text[tom],
          ...(escala.textTransform ? { textTransform: escala.textTransform } : {}),
          // Figuras tabulares: os dígitos não pulam quando o número muda.
          ...(escala.tabular ? { fontVariant: ['tabular-nums'] as const } : {}),
        },
        style,
      ]}
    />
  );
}
