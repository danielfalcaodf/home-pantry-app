import { useState } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';

import { ALVO_TOQUE_MINIMO, espaco } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { tipografia } from '../theme/tipografia';
import { Texto } from './texto';

export type CampoTextoProps = Omit<TextInputProps, 'style'> & {
  rotulo: string;
  erro?: string;
};

const ESPESSURA_FOCO = 2;

/**
 * Rótulo sempre visível acima do campo — placeholder como rótulo desaparece
 * quando o usuário digita, justo quando ele mais precisa saber o que é.
 */
export function CampoTexto({ rotulo, erro, ...props }: CampoTextoProps) {
  const tema = useTheme();
  const [focado, setFocado] = useState(false);
  const corDoDivisor = erro
    ? tema.state.critico
    : focado
      ? tema.action.azulejo
      : tema.line.hairline;

  return (
    <View style={{ gap: espaco.xs }}>
      <Texto papel="label" tom="secondary">
        {rotulo}
      </Texto>
      <TextInput
        {...props}
        accessibilityLabel={rotulo}
        onFocus={(evento) => {
          setFocado(true);
          props.onFocus?.(evento);
        }}
        onBlur={(evento) => {
          setFocado(false);
          props.onBlur?.(evento);
        }}
        placeholderTextColor={tema.text.secondary}
        style={{
          minHeight: ALVO_TOQUE_MINIMO,
          paddingVertical: espaco.md,
          color: tema.text.primary,
          fontFamily: tipografia['body.md'].fontFamily,
          fontSize: tipografia['body.md'].fontSize,
          borderBottomWidth: ESPESSURA_FOCO,
          borderBottomColor: corDoDivisor,
        }}
      />
      {erro ? (
        <Texto papel="label" cor={tema.state.critico}>
          {erro}
        </Texto>
      ) : null}
    </View>
  );
}
