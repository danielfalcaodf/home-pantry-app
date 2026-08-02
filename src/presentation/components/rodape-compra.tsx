import { View } from 'react-native';

import { totalPago } from '../../domain/compra/compra.rules';
import { formatarBRL } from '../../domain/shared/dinheiro';
import { CompraItem } from '../../domain/compra/compra';
import { espaco } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { Texto } from './texto';

export type RodapeCompraProps = {
  itens: readonly CompraItem[];
};

/**
 * Contador e total trocam direto no próximo render, sem contagem progressiva
 * (design D7/§9): o total corrente usa a MESMA função de domínio do
 * fechamento (task 5.3), então o que a pessoa vê é sempre o que vai gravar.
 */
export function RodapeCompra({ itens }: RodapeCompraProps) {
  const tema = useTheme();
  const marcados = itens.filter((item) => item.comprado).length;
  const total = totalPago(itens);

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
        {marcados} de {itens.length}
      </Texto>
      <Texto papel="data.lg">{formatarBRL(total)}</Texto>
    </View>
  );
}
