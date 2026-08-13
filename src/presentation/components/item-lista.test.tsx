import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { ItemDaLista } from '../../domain/lista/lista';
import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { ThemeProvider } from '../theme/provider';
import { ItemLista } from './item-lista';

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

afterEach(cleanup);

function produto(sobrescreve: Partial<Extract<ItemDaLista, { tipo: 'produto' }>> = {}): ItemDaLista {
  return {
    tipo: 'produto',
    produtoId: 'p1',
    nome: 'Arroz',
    categoria: 'Grãos',
    unidade: 'pacote',
    quantidadeAComprar: milesimos(1000),
    valorUnitario: centavos(890),
    custo: centavos(890),
    semPreco: false,
    ...sobrescreve,
  };
}

function avulso(sobrescreve: Partial<Extract<ItemDaLista, { tipo: 'avulso' }>> = {}): ItemDaLista {
  return {
    tipo: 'avulso',
    itemId: 'a1',
    nome: 'Carvão',
    categoria: null,
    unidade: 'un',
    quantidadeAComprar: milesimos(1000),
    valorUnitario: centavos(1800),
    custo: centavos(1800),
    semPreco: false,
    ...sobrescreve,
  };
}

describe('ItemLista', () => {
  it('item avulso renderiza com o prefixo "+ " no nome', async () => {
    await comTema(<ItemLista item={avulso({ nome: 'Carvão' })} categoria={null} onRemover={jest.fn()} />);

    expect(screen.getByText('+ Carvão')).toBeTruthy();
  });

  it('item de produto não recebe o prefixo', async () => {
    await comTema(<ItemLista item={produto({ nome: 'Arroz' })} categoria="Grãos" onRemover={jest.fn()} />);

    expect(screen.getByText('Arroz')).toBeTruthy();
    expect(screen.queryByText('+ Arroz')).toBeNull();
  });

  it('item com semPreco verdadeiro exibe a indicação de sem preço, não o valor', async () => {
    await comTema(
      <ItemLista
        item={produto({ nome: 'Sabão', semPreco: true, custo: centavos(0) })}
        categoria="Limpeza"
        onRemover={jest.fn()}
      />,
    );

    expect(screen.getByText('sem preço')).toBeTruthy();
    expect(screen.queryByText('R$ 0,00')).toBeNull();
  });

  it('item com preço exibe o valor formatado, não a indicação de sem preço', async () => {
    await comTema(<ItemLista item={produto({ custo: centavos(890) })} categoria="Grãos" onRemover={jest.fn()} />);

    expect(screen.getByText('R$ 8,90')).toBeTruthy();
    expect(screen.queryByText('sem preço')).toBeNull();
  });

  it('remover chama onRemover ao tocar', async () => {
    const onRemover = jest.fn();
    await comTema(<ItemLista item={produto()} categoria="Grãos" onRemover={onRemover} />);

    await fireEvent.press(screen.getByLabelText('Remover Arroz da lista'));

    expect(onRemover).toHaveBeenCalledTimes(1);
  });
});
