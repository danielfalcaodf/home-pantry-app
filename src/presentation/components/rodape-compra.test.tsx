import { render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { CompraItem } from '../../domain/compra/compra';
import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { ThemeProvider } from '../theme/provider';
import { RodapeCompra } from './rodape-compra';

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

let sequencia = 0;
function item(sobrescreve: Partial<CompraItem> = {}): CompraItem {
  sequencia += 1;
  return {
    id: `item-${sequencia}`,
    compraId: 'compra-1',
    produtoId: 'p1',
    nomeAvulso: null,
    unidade: 'un',
    quantidadePlanejada: milesimos(1000),
    quantidadeComprada: null,
    valorEstimadoUnit: centavos(0),
    valorPagoUnitario: null,
    comprado: false,
    ordem: 0,
    excluido: false,
    atualizarPreco: null,
    ...sobrescreve,
  };
}

describe('RodapeCompra', () => {
  it('mostra a contagem de marcados sobre o total e o total corrente pago', async () => {
    const itens = [
      item({ comprado: true, quantidadeComprada: milesimos(2000), valorPagoUnitario: centavos(950) }),
      item({ comprado: false }),
      item({ comprado: true, quantidadeComprada: milesimos(1000), valorPagoUnitario: centavos(300) }),
    ];
    await comTema(<RodapeCompra itens={itens} />);
    expect(screen.getByText('2 de 3')).toBeTruthy();
    // 2000×950/1000 + 1000×300/1000 = 1900 + 300 = 2200 = R$ 22,00
    expect(screen.getByText('R$ 22,00')).toBeTruthy();
  });

  it('nenhum item marcado: total zero', async () => {
    await comTema(<RodapeCompra itens={[item(), item()]} />);
    expect(screen.getByText('0 de 2')).toBeTruthy();
    expect(screen.getByText('R$ 0,00')).toBeTruthy();
  });
});
