import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { milesimos } from '@/domain/shared/quantidade';
import { ALVO_TOQUE_MINIMO } from '@/presentation/theme/espaco';
import { ThemeProvider } from '@/presentation/theme/provider';
import { tipografia } from '@/presentation/theme/tipografia';
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

describe('Detalhe do produto — quantidade em destaque (ACHADO-041)', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockPush.mockClear();
  });

  // Task 1.2: cenário exato do bug — tocar a quantidade abre o sheet de ajuste.
  it('tocar a quantidade em destaque abre o SheetAjusteEstoque', async () => {
    await comTema(<DetalheProduto />);
    expect(screen.queryByText('Corrigir Arroz')).toBeNull();
    fireEvent.press(screen.getByLabelText('Corrigir quantidade atual'));
    await waitFor(() => expect(screen.getByText('Corrigir Arroz')).toBeTruthy());
  });

  // Task 1.3: com quantidadeAtualEditavel={false}, nenhum campo de texto
  // solto de "Quanto tenho agora" aparece no formulário embutido, mesmo com
  // "Mais opções" expandido.
  it('com quantidadeAtualEditavel={false}, o formulário embutido nunca expõe "Quanto tenho agora"', async () => {
    await comTema(<DetalheProduto />);
    fireEvent.press(screen.getByText('Mais opções'));
    await waitFor(() => expect(screen.getByText('Menos opções')).toBeTruthy());
    expect(screen.queryByLabelText('Quanto tenho agora')).toBeNull();
  });

  // Task 1.4: a quantidade em destaque usa o papel tipográfico display.lg.
  it('a quantidade em destaque usa o papel tipográfico display.lg', async () => {
    await comTema(<DetalheProduto />);
    const texto = screen.getByText('2 kg');
    const estilo = estiloResolvido(texto);
    expect(estilo.fontSize).toBe(tipografia['display.lg'].fontSize);
    expect(estilo.fontFamily).toBe(tipografia['display.lg'].fontFamily);
  });
});
