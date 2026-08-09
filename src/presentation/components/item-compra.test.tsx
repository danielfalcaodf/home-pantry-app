import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { ItemDaCompra } from '../../application/compra/use-modo-compra';
import { CompraItem } from '../../domain/compra/compra';
import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { ThemeProvider } from '../theme/provider';
import { ItemCompra } from './item-compra';

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

function itemBase(sobrescreve: Partial<CompraItem> = {}): CompraItem {
  return {
    id: 'item-1',
    compraId: 'compra-1',
    produtoId: 'p1',
    nomeAvulso: null,
    unidade: 'un',
    quantidadePlanejada: milesimos(2000),
    quantidadeComprada: null,
    valorEstimadoUnit: centavos(890),
    valorPagoUnitario: null,
    comprado: false,
    ordem: 0,
    excluido: false,
    atualizarPreco: null,
    ...sobrescreve,
  };
}

function linhaBase(sobrescreve: Partial<ItemDaCompra> = {}): ItemDaCompra {
  return {
    item: itemBase(),
    produto: { id: 'p1', nome: 'Arroz', categoria: 'Grãos', unidade: 'un', valorUnitario: centavos(890) },
    divergePreco: false,
    ...sobrescreve,
  };
}

describe('ItemCompra', () => {
  it('item não marcado mostra nome, quantidade e preço estimado', async () => {
    await comTema(
      <ItemCompra linha={linhaBase()} onMarcar={jest.fn()} onDesmarcar={jest.fn()} onAjustar={jest.fn()} onResponderPreco={jest.fn()} />,
    );
    expect(screen.getByText('Arroz')).toBeTruthy();
    expect(screen.getByText('R$ 8,90')).toBeTruthy();
  });

  it('toque na linha marca o item', async () => {
    const onMarcar = jest.fn();
    await comTema(
      <ItemCompra linha={linhaBase()} onMarcar={onMarcar} onDesmarcar={jest.fn()} onAjustar={jest.fn()} onResponderPreco={jest.fn()} />,
    );
    fireEvent.press(screen.getByLabelText('Marcar Arroz'));
    expect(onMarcar).toHaveBeenCalledTimes(1);
  });

  it('item marcado tem risco no nome e chama desmarcar ao tocar de novo', async () => {
    const onDesmarcar = jest.fn();
    await comTema(
      <ItemCompra
        linha={linhaBase({ item: itemBase({ comprado: true, quantidadeComprada: milesimos(2000) }) })}
        onMarcar={jest.fn()}
        onDesmarcar={onDesmarcar}
        onAjustar={jest.fn()}
        onResponderPreco={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByLabelText('Desmarcar Arroz'));
    expect(onDesmarcar).toHaveBeenCalledTimes(1);
  });

  it('item avulso nunca mostra a pergunta de atualizar preço', async () => {
    await comTema(
      <ItemCompra
        linha={linhaBase({
          item: itemBase({ produtoId: null, nomeAvulso: 'Pilha AA', comprado: true, quantidadeComprada: milesimos(1000), valorPagoUnitario: centavos(300) }),
          produto: null,
          divergePreco: false,
        })}
        onMarcar={jest.fn()}
        onDesmarcar={jest.fn()}
        onAjustar={jest.fn()}
        onResponderPreco={jest.fn()}
      />,
    );
    expect(screen.queryByText(/Atualizar o preço/)).toBeNull();
  });

  it('item marcado com preço divergente mostra a pergunta embutida na linha, sem modal', async () => {
    const onResponderPreco = jest.fn();
    await comTema(
      <ItemCompra
        linha={linhaBase({
          item: itemBase({ comprado: true, quantidadeComprada: milesimos(2000), valorPagoUnitario: centavos(950) }),
          divergePreco: true,
        })}
        onMarcar={jest.fn()}
        onDesmarcar={jest.fn()}
        onAjustar={jest.fn()}
        onResponderPreco={onResponderPreco}
      />,
    );
    expect(screen.getByText(/Atualizar o preço de Arroz para R\$ 9,50/)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Sim' }));
    expect(onResponderPreco).toHaveBeenCalledWith(true);
  });
});
