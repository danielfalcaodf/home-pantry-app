import { View } from 'react-native';

import { espaco } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { Botao } from './botao';
import { Texto } from './texto';

export type TelaErroProps = {
  /** O que houve, sem pedido de desculpas (FRONTEND §11). */
  titulo: string;
  /** A ação de recuperação, em linguagem de quem usa. */
  descricao: string;
  detalhe?: string;
  acao?: { titulo: string; onPress: () => void };
};

export function TelaErro({ titulo, descricao, detalhe, acao }: TelaErroProps) {
  const tema = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: espaco.xl,
        gap: espaco.lg,
        backgroundColor: tema.bg.base,
      }}
    >
      <Texto papel="display.sm" style={{ textAlign: 'center' }}>
        {titulo}
      </Texto>
      <Texto papel="body.md" tom="secondary" style={{ textAlign: 'center' }}>
        {descricao}
      </Texto>
      {acao ? <Botao titulo={acao.titulo} onPress={acao.onPress} /> : null}
      {detalhe ? (
        <Texto papel="caption" tom="secondary" style={{ textAlign: 'center' }}>
          {detalhe}
        </Texto>
      ) : null}
    </View>
  );
}
