import { View } from 'react-native';

import { espaco } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { Texto } from './texto';

export type BarraDeDado = {
  chave: string;
  rotulo: string;
  valor: number;
};

export type GraficoBarrasProps = {
  dados: readonly BarraDeDado[];
  altura?: number;
};

/**
 * Barras via `View` com altura proporcional ao maior valor do período —
 * sem lib de gráfico (design D6). Só leitura: sem toque, sem contagem
 * progressiva (FRONTEND §9).
 */
export function GraficoBarras({ dados, altura = 96 }: GraficoBarrasProps) {
  const tema = useTheme();
  const maior = Math.max(...dados.map((dado) => dado.valor), 0);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: espaco.sm, height: altura }}>
      {dados.map((dado) => {
        const fracao = maior > 0 ? dado.valor / maior : 0;
        return (
          <View key={dado.chave} style={{ flex: 1, alignItems: 'center', gap: espaco.xs }}>
            <View
              style={{
                width: '100%',
                height: Math.max(altura * fracao, dado.valor > 0 ? 2 : 0),
                borderRadius: 0,
                backgroundColor: dado.valor > 0 ? tema.action.azulejo : tema.line.hairline,
              }}
            />
            <Texto papel="caption" tom="secondary">
              {dado.rotulo}
            </Texto>
          </View>
        );
      })}
    </View>
  );
}
