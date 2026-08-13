import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { milesimos } from '@/domain/shared/quantidade';
import { ALVO_TOQUE_MINIMO } from '@/presentation/theme/espaco';
import { ThemeProvider } from '@/presentation/theme/provider';
import DetalheProduto from './[id]';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { back: () => mockBack(), push: (...a: unknown[]) => mockPush(...a) },
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ id: 'p1' }),
}));

const mockItem = {
  produto: {
    id: 'p1',
    nome: 'Arroz',
    categoria: 'Grãos',
    unidade: 'kg' as const,
    quantidadeAtual: milesimos(2000),
    quantidadeNecessaria: milesimos(2000),
    valorUnitario: 0,
    marcaPreferida: null,
    observacao: null,
  },
  estado: 'ok' as const,
  fracao: 1,
  temSobra: false,
  rotulo: 'Cheio',
};

jest.mock('@/application/estoque/use-editar-produto', () => ({
  useProduto: () => ({ item: mockItem, carregando: false }),
  useEditarProduto: () => ({ editar: jest.fn() }),
  useRemoverProduto: () => ({ remover: jest.fn() }),
}));
jest.mock('@/application/estoque/use-categorias', () => ({ useCategorias: () => [] }));
jest.mock('@/application/estoque/use-dar-baixa', () => ({ useDarBaixa: () => ({ registrar: jest.fn() }) }));
jest.mock('@/application/estoque/use-repor-pontual', () => ({ useReporPontual: () => ({ registrar: jest.fn() }) }));
jest.mock('@/application/estoque/use-ajustar-estoque', () => ({ useAjustarEstoque: () => ({ ajustar: jest.fn() }) }));
jest.mock('@/application/estoque/use-desfazer-movimento', () => ({ useDesfazerMovimento: () => ({ desfazer: jest.fn() }) }));
jest.mock('@/application/estoque/use-resumo-historico', () => ({
  useResumoHistoricoRecente: () => ({ carregando: false, quantidadeDeUsos: 3 }),
}));

function estiloResolvido(elemento: { props: { style?: unknown } }) {
  const { style } = elemento.props;
  return Array.isArray(style) ? Object.assign({}, ...style) : style;
}

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('Detalhe do produto — alvos de toque (ACHADO-063)', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockPush.mockClear();
  });

  it('"Corrigir quantidade atual" mede ao menos 48×48dp', async () => {
    await comTema(<DetalheProduto />);
    const botao = screen.getByLabelText('Corrigir quantidade atual');
    const estilo = estiloResolvido(botao);
    expect(estilo.minWidth).toBeGreaterThanOrEqual(ALVO_TOQUE_MINIMO);
    expect(estilo.minHeight).toBeGreaterThanOrEqual(ALVO_TOQUE_MINIMO);
  });

  it('tocar em "Corrigir quantidade atual" ainda abre o sheet de ajuste', async () => {
    await comTema(<DetalheProduto />);
    fireEvent.press(screen.getByLabelText('Corrigir quantidade atual'));
    await waitFor(() => expect(screen.getByText('Corrigir Arroz')).toBeTruthy());
  });

  it('"Ver histórico completo" mede ao menos 48dp de altura', async () => {
    await comTema(<DetalheProduto />);
    const botao = screen.getByLabelText('Ver histórico completo');
    expect(estiloResolvido(botao).minHeight).toBeGreaterThanOrEqual(ALVO_TOQUE_MINIMO);
  });

  it('tocar em "Ver histórico completo" ainda navega para /produto/[id]/historico', async () => {
    await comTema(<DetalheProduto />);
    fireEvent.press(screen.getByLabelText('Ver histórico completo'));
    expect(mockPush).toHaveBeenCalledWith('/produto/p1/historico');
  });
});
