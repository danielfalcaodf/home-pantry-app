import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { centavos } from '@/domain/shared/dinheiro';
import { milesimos } from '@/domain/shared/quantidade';
import { ThemeProvider } from '@/presentation/theme/provider';
import DetalheDaCompra from './[id]';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'c1' }),
  useRouter: () => ({ back: mockBack }),
}));

type ItemFake = {
  item: {
    id: string;
    produtoId: string | null;
    nomeAvulso: string | null;
    unidade: string;
    quantidadePlanejada: number;
    quantidadeComprada: number | null;
    comprado: boolean;
    valorPagoUnitario: number | null;
  };
  produto: { nome: string } | null;
};

let mockCompra: { id: string; status: 'fechada' | 'cancelada'; valorTotalPago: number | null } | null = null;
let mockItens: ItemFake[] = [];

jest.mock('@/application/resumo/use-detalhe-compra', () => ({
  useDetalheDaCompra: () => ({
    carregando: false,
    get compra() {
      return mockCompra;
    },
    get itens() {
      return mockItens;
    },
  }),
}));

function itemFake(sobrescreve: Partial<ItemFake['item']> = {}, produto: ItemFake['produto'] = { nome: 'Arroz' }): ItemFake {
  return {
    item: {
      id: 'i1',
      produtoId: 'p1',
      nomeAvulso: null,
      unidade: 'kg',
      quantidadePlanejada: milesimos(1000),
      quantidadeComprada: milesimos(1000),
      comprado: true,
      valorPagoUnitario: centavos(500),
      ...sobrescreve,
    },
    produto,
  };
}

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('Detalhe da compra — itens não comprados e avulsos (ACHADO-045, task 3.5)', () => {
  beforeEach(() => {
    mockCompra = { id: 'c1', status: 'fechada', valorTotalPago: centavos(500) };
  });

  it('item não comprado é identificado com "· não comprado"', async () => {
    mockItens = [itemFake({ id: 'i1', comprado: false, valorPagoUnitario: null })];
    await comTema(<DetalheDaCompra />);
    expect(screen.getByText(/· não comprado/)).toBeTruthy();
  });

  it('item comprado normalmente não exibe "· não comprado"', async () => {
    mockItens = [itemFake({ id: 'i1', comprado: true })];
    await comTema(<DetalheDaCompra />);
    expect(screen.queryByText(/· não comprado/)).toBeNull();
  });

  it('item avulso (sem produtoId) é identificado com "· avulso"', async () => {
    mockItens = [
      itemFake({ id: 'i2', produtoId: null, nomeAvulso: 'Guardanapo', comprado: true }, null),
    ];
    await comTema(<DetalheDaCompra />);
    expect(screen.getByText('Guardanapo')).toBeTruthy();
    expect(screen.getByText(/· avulso/)).toBeTruthy();
  });

  it('item vinculado a um produto cadastrado não exibe "· avulso"', async () => {
    mockItens = [itemFake({ id: 'i3', produtoId: 'p1', comprado: true })];
    await comTema(<DetalheDaCompra />);
    expect(screen.queryByText(/· avulso/)).toBeNull();
  });
});

describe('Detalhe da compra — botão Voltar (ACHADO-049, task 5.5)', () => {
  it('tocar no botão "←" chama router.back(), retornando ao Histórico de compras', async () => {
    mockCompra = { id: 'c1', status: 'fechada', valorTotalPago: centavos(500) };
    mockItens = [];
    mockBack.mockClear();
    await comTema(<DetalheDaCompra />);
    fireEvent.press(screen.getByLabelText('Voltar'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
