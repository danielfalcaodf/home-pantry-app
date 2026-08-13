import { render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { milesimos } from '@/domain/shared/quantidade';
import { ThemeProvider } from '@/presentation/theme/provider';
import HistoricoDoProduto from './historico';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'p1' }),
  useRouter: () => ({ back: jest.fn() }),
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
