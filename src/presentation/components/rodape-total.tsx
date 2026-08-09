import { View } from 'react-native';

import { Centavos, formatarBRL } from '../../domain/shared/dinheiro';
import { espaco } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { Texto } from './texto';

export type RodapeTotalProps = {
  contagemItens: number;
  total: Centavos;
  contagemSemPreco: number;
};

/**
 * Rótulo "estimado da compra" é deliberado (design D4/§Distinção): nunca
 * confundível com o valor do que já está em casa. Números em mono, sem
 * animação de contagem — o total troca direto no próximo render.
 */
export function RodapeTotal({ contagemItens, total, contagemSemPreco }: RodapeTotalProps) {
  const tema = useTheme();
  const plural = contagemItens !== 1;

  return (
    <View
      style={{
        paddingHorizontal: espaco.lg,
        paddingVertical: espaco.md,
        gap: espaco.xs,
        borderBottomWidth: 1,
        borderBottomColor: tema.line.hairline,
      }}
    >
      <Texto papel="data.lg">
        {contagemItens} {plural ? 'itens' : 'item'} · {formatarBRL(total)} estimado
      </Texto>
      {contagemSemPreco > 0 ? (
        <Texto papel="label" tom="secondary">
          {contagemSemPreco} {contagemSemPreco !== 1 ? 'itens' : 'item'} sem preço cadastrado
        </Texto>
      ) : null}
    </View>
  );
}
