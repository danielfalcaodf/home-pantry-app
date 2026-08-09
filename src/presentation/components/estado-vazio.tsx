import { View } from 'react-native';

import { espaco } from '../theme/espaco';
import { Botao } from './botao';
import { Texto } from './texto';

export type EstadoVazioProps = {
  /** Convite, nunca aviso seco (FRONTEND §11). */
  convite: string;
  acao?: { titulo: string; onPress: () => void };
};

export function EstadoVazio({ convite, acao }: EstadoVazioProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: espaco.xl,
        gap: espaco.xl,
      }}
    >
      <Texto papel="body.lg" style={{ textAlign: 'center' }}>
        {convite}
      </Texto>
      {acao ? <Botao titulo={acao.titulo} onPress={acao.onPress} /> : null}
    </View>
  );
}
