import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { milesimos } from '@/domain/shared/quantidade';
import { ThemeProvider } from '@/presentation/theme/provider';
import { despensa } from '@/presentation/theme/tokens';
import HistoricoDoProduto from './historico';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'p1' }),
  useRouter: () => ({ back: mockBack }),
}));

let mockItens: {
  id: string;
  casaId: string;
  produtoId: string;
  usuarioId: string;
  compraId: string | null;
  tipo: 'baixa' | 'reposicao' | 'ajuste';
  quantidadeDelta: number;
  quantidadeResultante: number;
  motivo: string | null;
  criadoEm: number;
  syncStatus: 'local';
}[] = [];

jest.mock('@/application/estoque/use-historico', () => ({
  useHistoricoDoProduto: () => ({ itens: mockItens, carregando: false, carregarMais: jest.fn() }),
}));

jest.mock('@/application/estoque/use-editar-produto', () => ({
  useProduto: () => ({
    item: {
      produto: { id: 'p1', nome: 'Arroz', unidade: 'pacote' },
    },
    carregando: false,
  }),
}));

function movimentoFake(sobrescreve: Partial<(typeof mockItens)[number]> = {}) {
  return {
    id: 'm1',
    casaId: 'casa-1',
    produtoId: 'p1',
    usuarioId: 'u1',
    compraId: null,
    tipo: 'baixa' as const,
    quantidadeDelta: milesimos(-3000),
    quantidadeResultante: milesimos(0),
    motivo: null,
    criadoEm: new Date(2026, 7, 9, 10, 30).getTime(),
    syncStatus: 'local' as const,
    ...sobrescreve,
  };
}

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('Histórico do produto — linha acessível', () => {
  // ACHADO-064: uma única unidade acessível por linha (verbo + quantidade +
  // data + motivo), não três Textos soltos no snapshot de acessibilidade.
  it('linha de ajuste com motivo monta um único rótulo combinado', async () => {
    mockItens = [
      movimentoFake({
        tipo: 'ajuste',
        quantidadeResultante: milesimos(3000),
        motivo: 'conferência',
      }),
    ];
    await comTema(<HistoricoDoProduto />);
    expect(
      screen.getByLabelText('Corrigi para 3 pacotes, 09/08/2026 às 10:30 · conferência'),
    ).toBeTruthy();
  });

  it('linha sem motivo (consumo comum) não pendura "· motivo" no rótulo', async () => {
    mockItens = [movimentoFake({ tipo: 'baixa', quantidadeDelta: milesimos(-1000) })];
    await comTema(<HistoricoDoProduto />);
    expect(screen.getByLabelText('Usei 1 pacote, 09/08/2026 às 10:30')).toBeTruthy();
    expect(screen.queryByLabelText(/·/)).toBeNull();
  });

  it('o texto visível de cada linha continua fragmentado (verbo e data em Textos separados)', async () => {
    mockItens = [movimentoFake({ tipo: 'baixa', quantidadeDelta: milesimos(-1000) })];
    await comTema(<HistoricoDoProduto />);
    expect(screen.getByText('Usei')).toBeTruthy();
    expect(screen.getByText('1 pacote')).toBeTruthy();
    expect(screen.getByText('09/08/2026 às 10:30')).toBeTruthy();
  });
});

describe('Histórico do produto — cor por tipo de movimento (ACHADO-042, task 2.6)', () => {
  it('consumo, reposição e ajuste usam cores distintas entre si (corDoMovimento)', async () => {
    mockItens = [
      movimentoFake({ id: 'm-baixa', tipo: 'baixa', quantidadeDelta: milesimos(-1000) }),
      movimentoFake({
        id: 'm-reposicao',
        tipo: 'reposicao',
        quantidadeDelta: milesimos(1000),
        compraId: null,
      }),
      movimentoFake({
        id: 'm-ajuste',
        tipo: 'ajuste',
        quantidadeResultante: milesimos(2000),
        motivo: 'conferência',
      }),
    ];
    await comTema(<HistoricoDoProduto />);

    const corDoTexto = (texto: { props: { style?: unknown } }) => {
      const { style } = texto.props;
      return (Array.isArray(style) ? Object.assign({}, ...style) : style)?.color;
    };

    const corConsumo = corDoTexto(screen.getByText('Usei'));
    const corReposicao = corDoTexto(screen.getByText('Repus'));
    const corAjuste = corDoTexto(screen.getByText('Corrigi para'));

    expect(corConsumo).toBe(despensa.text.primary);
    expect(corReposicao).toBe(despensa.state.cheio);
    expect(corAjuste).toBe(despensa.action.azulejo);
    expect(new Set([corConsumo, corReposicao, corAjuste]).size).toBe(3);
  });
});

describe('Histórico do produto — botão Voltar (ACHADO-049, task 5.6)', () => {
  it('tocar no botão "←" chama router.back(), retornando ao Detalhe do produto', async () => {
    mockItens = [];
    mockBack.mockClear();
    await comTema(<HistoricoDoProduto />);
    fireEvent.press(screen.getByLabelText('Voltar'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
