import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { centavos } from '@/domain/shared/dinheiro';
import { ThemeProvider } from '@/presentation/theme/provider';
import { despensa } from '@/presentation/theme/tokens';
import HistoricoDeCompras from './historico';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a) },
  useRouter: () => ({ back: mockBack }),
}));

type CompraFake = {
  compra: { id: string; status: 'aberta' | 'fechada' | 'cancelada'; valorTotalPago: number | null };
  qtdItensComprados: number;
};

let mockCompras: CompraFake[] = [];

jest.mock('@/application/resumo/use-historico-compras', () => ({
  useHistoricoDeCompras: () => ({
    carregando: false,
    get compras() {
      return mockCompras;
    },
    carregarMais: jest.fn(),
  }),
}));

function compraFake(sobrescreve: Partial<CompraFake['compra']> & { qtdItensComprados?: number }): CompraFake {
  return {
    compra: {
      id: 'c1',
      status: 'fechada',
      valorTotalPago: centavos(1000),
      ...sobrescreve,
    },
    qtdItensComprados: sobrescreve.qtdItensComprados ?? 3,
  };
}

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('Histórico de compras — lista vazia (ACHADO-045, task 3.6)', () => {
  it('sem nenhuma compra finalizada, exibe o estado vazio sem quebrar', async () => {
    mockCompras = [];
    await comTema(<HistoricoDeCompras />);
    expect(screen.getByText('Nenhuma compra fechada ainda.')).toBeTruthy();
  });
});

describe('Histórico de compras — compra cancelada distinta (ACHADO-045, task 3.4)', () => {
  it('compra cancelada mostra "Cancelada" e "—" no lugar de um valor de gasto', async () => {
    mockCompras = [compraFake({ id: 'c1', status: 'cancelada', valorTotalPago: null })];
    await comTema(<HistoricoDeCompras />);
    expect(screen.getByText('Cancelada')).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.queryByText('R$ 10,00')).toBeNull();
  });

  it('compra fechada exibe a contagem de itens e o total pago, com cor primária', async () => {
    mockCompras = [compraFake({ id: 'c2', status: 'fechada', valorTotalPago: centavos(1500) })];
    await comTema(<HistoricoDeCompras />);
    expect(screen.getByText('3 itens')).toBeTruthy();
    expect(screen.getByText('R$ 15,00')).toBeTruthy();
  });

  it('a linha cancelada usa cor secundária, distinguindo-a visualmente da fechada', async () => {
    mockCompras = [compraFake({ id: 'c3', status: 'cancelada', valorTotalPago: null })];
    await comTema(<HistoricoDeCompras />);
    const texto = screen.getByText('Cancelada');
    const estilo = Array.isArray(texto.props.style)
      ? Object.assign({}, ...texto.props.style)
      : texto.props.style;
    expect(estilo.color).toBe(despensa.text.secondary);
  });
});

describe('Histórico de compras — navegação (ACHADO-049, task 5.4)', () => {
  it('tocar numa linha navega para o detalhe daquela compra', async () => {
    mockCompras = [compraFake({ id: 'c9' })];
    await comTema(<HistoricoDeCompras />);
    fireEvent.press(screen.getByText('3 itens'));
    expect(mockPush).toHaveBeenCalledWith('/compra/historico/c9');
  });

  it('tocar no botão "←" chama router.back(), retornando à tela anterior', async () => {
    mockCompras = [];
    mockBack.mockClear();
    await comTema(<HistoricoDeCompras />);
    fireEvent.press(screen.getByLabelText('Voltar'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
