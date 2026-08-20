import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Alert } from 'react-native';

import { milesimos } from '@/domain/shared/quantidade';
import { LIMITE_SANIDADE_QUANTIDADE } from '@/presentation/components/formulario-produto';
import { IconeSvg } from '@/presentation/components/icone-svg';
import { icones } from '@/presentation/theme/icones';
import { ALVO_TOQUE_MINIMO } from '@/presentation/theme/espaco';
import { despensa } from '@/presentation/theme/tokens';
import { ThemeProvider } from '@/presentation/theme/provider';
import { tipografia } from '@/presentation/theme/tipografia';
import DetalheProduto from './[id]';

// Testa o contrato do botão "Tirar da despensa" com IconeSvg (path/cor
// recebidos) em vez de inspecionar o SVG nativo já processado.
jest.mock('@/presentation/components/icone-svg', () => ({ IconeSvg: jest.fn(() => null) }));
const iconeMock = IconeSvg as jest.Mock;

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockEditar = jest.fn().mockResolvedValue({ ok: true });

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
  useEditarProduto: () => ({ editar: mockEditar }),
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

type NoJSON = { type: string; props?: Record<string, unknown>; children?: (NoJSON | string)[] | null };

/** Achata a árvore de `toJSON()` num array — usado para provar posição
 *  estrutural (ex.: "Salvar" nunca é descendente do ScrollView). */
function todosOsNos(no: NoJSON | NoJSON[] | null): NoJSON[] {
  const raiz = Array.isArray(no) ? no : no ? [no] : [];
  return raiz.flatMap((n) => [
    n,
    ...todosOsNos((n.children ?? []).filter((c): c is NoJSON => typeof c !== 'string')),
  ]);
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

  it('resumo do histórico (AcaoSecundaria) mede ao menos 48dp de altura', async () => {
    await comTema(<DetalheProduto />);
    const botao = screen.getByLabelText('Você anotou 3 usos nos últimos 30 dias');
    expect(estiloResolvido(botao).minHeight).toBeGreaterThanOrEqual(ALVO_TOQUE_MINIMO);
  });

  it('tocar no resumo do histórico ainda navega para /produto/[id]/historico', async () => {
    await comTema(<DetalheProduto />);
    fireEvent.press(screen.getByLabelText('Você anotou 3 usos nos últimos 30 dias'));
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

describe('Detalhe do produto — teto de sanidade em "Quanto quero ter em casa" (Error Prevention)', () => {
  beforeEach(() => {
    mockEditar.mockClear();
  });

  // Reprodução exata do bug relatado: "26666" era salvo sem confirmação.
  it('valor acima do teto é rejeitado com erro em texto, sem chamar editar', async () => {
    await comTema(<DetalheProduto />);

    fireEvent.changeText(screen.getByLabelText('Quanto quero ter em casa'), String(LIMITE_SANIDADE_QUANTIDADE + 1));
    await waitFor(() =>
      expect(screen.getByLabelText('Quanto quero ter em casa').props.value).toBe(
        String(LIMITE_SANIDADE_QUANTIDADE + 1),
      ),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(screen.getByText(`Valor muito alto — no máximo ${LIMITE_SANIDADE_QUANTIDADE}`)).toBeTruthy(),
    );
    expect(mockEditar).not.toHaveBeenCalled();
  });

  it('valor dentro do teto continua sendo salvo normalmente', async () => {
    await comTema(<DetalheProduto />);

    fireEvent.changeText(screen.getByLabelText('Quanto quero ter em casa'), '10');
    await waitFor(() => expect(screen.getByLabelText('Quanto quero ter em casa').props.value).toBe('10'));
    fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(mockEditar).toHaveBeenCalled());
  });
});

describe('Detalhe do produto — botão "Salvar" fora do fluxo de scroll (correcao-tela-editar-produto)', () => {
  it('"Salvar" não é descendente do ScrollView do formulário — mesma estrutura de rodapé fixo de "Novo produto"', async () => {
    // Reprodução estrutural do bug: com `telaCheia={false}` (antes desta
    // change) o formulário embutido não tinha container `flex:1` próprio, e
    // o rodapé "fixo" caía dentro do ScrollView externo da tela, rolando
    // junto com o conteúdo. Agora `telaCheia` (default) garante que "Salvar"
    // vive num `View` de rodapé, irmão do `ScrollView`, nunca dentro dele.
    await comTema(<DetalheProduto />);

    const arvore = todosOsNos(screen.toJSON() as unknown as NoJSON);
    const scrollViews = arvore.filter((no) => no.type === 'RCTScrollView');
    expect(scrollViews.length).toBeGreaterThan(0);
    for (const scroll of scrollViews) {
      const dentroDoScroll = todosOsNos(scroll).some((no) => no.props?.accessibilityLabel === 'Salvar');
      expect(dentroDoScroll).toBe(false);
    }
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeTruthy();
  });
});

describe('Detalhe do produto — "Tirar da despensa" com ícone e cor de perigo (correcao-tela-editar-produto)', () => {
  beforeEach(() => {
    iconeMock.mockClear();
  });

  it('renderiza o ícone de lixeira na cor state.critico do tema', async () => {
    await comTema(<DetalheProduto />);
    expect(iconeMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: icones.lixeira, cor: despensa.state.critico }),
      undefined,
    );
  });

  it('expõe accessibilityLabel "Tirar da despensa" — não depende só do ícone visual', async () => {
    await comTema(<DetalheProduto />);
    expect(screen.getByRole('button', { name: 'Tirar da despensa' })).toBeTruthy();
  });

  it('continua abrindo a confirmação de remoção ao ser tocado', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await comTema(<DetalheProduto />);

    fireEvent.press(screen.getByRole('button', { name: 'Tirar da despensa' }));

    expect(alertSpy).toHaveBeenCalledWith(
      'Tirar Arroz da despensa?',
      expect.any(String),
      expect.any(Array),
    );
    alertSpy.mockRestore();
  });
});
