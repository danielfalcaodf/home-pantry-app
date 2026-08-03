import { View } from 'react-native';

import { Centavos, formatarBRL } from '../../domain/shared/dinheiro';
import { espaco } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { Texto } from './texto';

export type RodapeCompraProps = {
  marcados: number;
  totalDeItens: number;
  total: Centavos;
};

/**
 * Contador e total trocam direto no próximo render, sem contagem progressiva
 * (design D7/§9). Recebe tudo pronto — inclusive o total, calculado por quem
 * chama com a mesma função de domínio do fechamento (task 5.3) — porque
 * presentation/ não importa regra de domínio, só tipos e formatadores.
 */
export function RodapeCompra({ marcados, totalDeItens, total }: RodapeCompraProps) {
  const tema = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: espaco.lg,
        paddingVertical: espaco.md,
        borderBottomWidth: 1,
        borderBottomColor: tema.line.hairline,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Texto papel="data.lg">
        {marcados} de {totalDeItens}
      </Texto>
      <Texto papel="data.lg">{formatarBRL(total)}</Texto>
    </View>
  );
}
