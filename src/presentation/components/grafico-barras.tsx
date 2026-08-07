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
 * progressiva (FRONTEND §9). Cor e opacidade batem com `SummaryScreen.jsx`
 * do design system: todas as barras usam `action.azulejo`, só o último
 * item (mês mais recente, sempre o último em `dados`) fica em opacidade
 * plena — os demais em 0.4, independente do valor de cada um.
 */
export function GraficoBarras({ dados, altura = 96 }: GraficoBarrasProps) {
  const tema = useTheme();
  const maior = Math.max(...dados.map((dado) => dado.valor), 0);
  const ultimoIndice = dados.length - 1;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: espaco.sm, height: altura }}>
      {dados.map((dado, indice) => {
        const fracao = maior > 0 ? dado.valor / maior : 0;
        return (
          <View key={dado.chave} style={{ flex: 1, alignItems: 'center', gap: espaco.xs }}>
            <View
              style={{
                width: '100%',
                height: dado.valor > 0 ? Math.max(altura * fracao, 2) : 0,
                backgroundColor: tema.action.azulejo,
                opacity: indice === ultimoIndice ? 1 : 0.4,
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
