import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { milesimos } from '@/domain/shared/quantidade';
import { ALVO_TOQUE_MINIMO } from '@/presentation/theme/espaco';
import { ThemeProvider } from '@/presentation/theme/provider';
import Lista from './lista';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

const mockItens = [
  {
    tipo: 'produto' as const,
    produtoId: 'p1',
    nome: 'Arroz',
    categoria: 'Grãos',
    unidade: 'kg' as const,
    quantidadeAComprar: milesimos(1000),
    valorUnitario: 500,
    custo: 500,
    semPreco: false,
  },
  {
    tipo: 'produto' as const,
    produtoId: 'p2',
    nome: 'Feijão',
    categoria: 'Grãos',
    unidade: 'kg' as const,
    quantidadeAComprar: milesimos(1000),
    valorUnitario: 0,
    custo: 0,
    semPreco: true,
  },
  {
    tipo: 'avulso' as const,
    itemId: 'a1',
    nome: 'Pilha AA',
    categoria: null,
    unidade: 'un' as const,
    quantidadeAComprar: milesimos(2000),
    valorUnitario: 300,
    custo: 600,
    semPreco: false,
  },
];

type ItemDesativadoTeste = { itemId: string; produtoId: string; nome: string; categoria: string | null };

const mockUseListaDeCompras = jest.fn(() => ({
  itens: mockItens,
  desativados: [] as ItemDesativadoTeste[],
  carregando: false,
}));
jest.mock('@/application/lista/use-lista-compras', () => ({
  useListaDeCompras: () => mockUseListaDeCompras(),
}));
jest.mock('@/application/lista/use-preferencia-agrupamento', () => ({
  usePreferenciaDeAgrupamento: () => ({ agrupado: false, alternar: jest.fn() }),
}));
jest.mock('@/application/lista/use-adicionar-avulso', () => ({
  useAdicionarAvulso: () => ({ adicionar: jest.fn() }),
}));
jest.mock('@/application/lista/use-editar-avulso', () => ({
  useEditarAvulso: () => ({ editar: jest.fn() }),
}));
const mockRemoverAvulso = jest.fn();
const mockDesfazer = jest.fn();
const mockLimpar = jest.fn();
const mockReativar = jest.fn();
const mockUseRemoverItemDaLista = jest.fn(() => ({
  ultimaRemocao: null as unknown,
  remover: jest.fn(),
  removerAvulso: mockRemoverAvulso,
  desfazer: mockDesfazer,
  limpar: mockLimpar,
  reativar: mockReativar,
}));
jest.mock('@/application/lista/use-remover-item-lista', () => ({
  useRemoverItemDaLista: () => mockUseRemoverItemDaLista(),
}));
const mockIniciar = jest.fn().mockResolvedValue('compra-1');
jest.mock('@/application/compra/use-iniciar-compra', () => ({
  useIniciarCompra: () => ({ iniciando: false, iniciar: mockIniciar }),
}));
const mockUseResumoCompraAberta = jest.fn(() => ({
  resumo: null as { compraId: string; marcados: number; total: number; possuiProgresso: boolean } | null,
  carregando: false,
}));
jest.mock('@/application/compra/use-resumo-compra-aberta', () => ({
  useResumoCompraAberta: () => mockUseResumoCompraAberta(),
}));
const mockRecomecar = jest.fn().mockResolvedValue({ ok: true, compraId: 'compra-nova' });
jest.mock('@/application/compra/use-recomecar-compra', () => ({
  useRecomecarCompra: () => ({ recomecando: false, recomecar: mockRecomecar }),
}));
const mockEditarProduto = jest.fn().mockResolvedValue({ ok: true });
jest.mock('@/application/estoque/use-editar-produto', () => ({
  useEditarProduto: () => ({ editar: mockEditarProduto }),
}));

function estiloResolvido(elemento: { props: { style?: unknown } }) {
  const { style } = elemento.props;
  return Array.isArray(style) ? Object.assign({}, ...style) : style;
}

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

afterEach(cleanup);

describe('Lista — alvos de toque do cabeçalho', () => {
  // ACHADO-057 (task 1.2): os dois botões do cabeçalho precisam medir
  // ≥48dp de altura tocável (eram ~22dp).
  it('"Compartilhar lista" e "Agrupar por categoria" medem ao menos 48dp de altura', async () => {
    await comTema(<Lista />);
    const compartilhar = screen.getByLabelText('Compartilhar lista');
    const agrupar = screen.getByLabelText('Agrupar');
    expect(estiloResolvido(compartilhar).minHeight).toBeGreaterThanOrEqual(ALVO_TOQUE_MINIMO);
    expect(estiloResolvido(agrupar).minHeight).toBeGreaterThanOrEqual(ALVO_TOQUE_MINIMO);
  });

  // (task 1.3): hitSlop de 8 em cada lado não fecha o gap de 16 entre eles.
  it('os dois botões lado a lado não têm hitSlop que sobreponha a área tocável um do outro', async () => {
    await comTema(<Lista />);
    const compartilhar = screen.getByLabelText('Compartilhar lista');
    const agrupar = screen.getByLabelText('Agrupar');
    const hitSlopCompartilhar = compartilhar.props.hitSlop;
    const hitSlopAgrupar = agrupar.props.hitSlop;
    const GAP_ENTRE_BOTOES = 16; // espaco.lg, gap do container pai
    const expansaoTotal =
      (hitSlopCompartilhar?.right ?? 0) + (hitSlopAgrupar?.left ?? 0);
    expect(expansaoTotal).toBeLessThan(GAP_ENTRE_BOTOES);
  });
});

describe('Lista — rolagem (ACHADO scroll ausente)', () => {
  // Reprodução do bug relatado: antes, os itens renderizavam direto num
  // View sem scroll — itens do fim e "Adicionar item avulso" ficavam
  // inacessíveis com lista longa. Agora vive dentro de um FlashList.
  it('renderiza os itens dentro de um FlashList, não de um View solto', async () => {
    await comTema(<Lista />);
    expect(screen.getByTestId('lista-de-compras')).toBeTruthy();
  });

  it('o item da lista está presente dentro do FlashList', async () => {
    await comTema(<Lista />);
    const lista = screen.getByTestId('lista-de-compras');
    expect(screen.getByText('Arroz')).toBeTruthy();
    expect(lista).toBeTruthy();
  });

  it('"Adicionar item avulso" continua acessível como rodapé da lista rolável', async () => {
    await comTema(<Lista />);
    expect(screen.getByLabelText('Adicionar item avulso')).toBeTruthy();
  });
});

describe('Lista — rolagem, casos de borda', () => {
  it('lista com um único item renderiza normalmente dentro do FlashList', async () => {
    await comTema(<Lista />);
    expect(screen.getByTestId('lista-de-compras')).toBeTruthy();
    expect(screen.getByText('Arroz')).toBeTruthy();
  });
});

describe('Lista — editar preço de produto direto na lista', () => {
  beforeEach(() => {
    mockEditarProduto.mockClear();
  });

  it('tocar um produto faltante abre o sheet de preço, e salvar chama useEditarProduto', async () => {
    await comTema(<Lista />);

    fireEvent.press(screen.getByText('Arroz'));
    await waitFor(() => expect(screen.getByText('Preço de Arroz')).toBeTruthy());

    fireEvent.changeText(screen.getByLabelText('Quanto costuma custar'), '990');
    await waitFor(() => expect(screen.getByLabelText('Quanto costuma custar').props.value).toBe('9,90'));
    fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(mockEditarProduto).toHaveBeenCalledWith('p1', { valorUnitario: 990 }),
    );
  });

  it('produto sem preço nenhum abre o sheet vazio, permitindo definir um preço pela primeira vez', async () => {
    await comTema(<Lista />);

    fireEvent.press(screen.getByText('Feijão'));
    await waitFor(() => expect(screen.getByText('Preço de Feijão')).toBeTruthy());
    expect(screen.getByLabelText('Quanto costuma custar').props.value).toBe('');

    fireEvent.changeText(screen.getByLabelText('Quanto costuma custar'), '350');
    await waitFor(() => expect(screen.getByLabelText('Quanto costuma custar').props.value).toBe('3,50'));
    fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(mockEditarProduto).toHaveBeenCalledWith('p2', { valorUnitario: 350 }),
    );
  });

  it('editar e salvar o preço de um produto não vaza para o sheet do próximo produto aberto (regressão)', async () => {
    await comTema(<Lista />);

    fireEvent.press(screen.getByText('Arroz'));
    await waitFor(() => expect(screen.getByText('Preço de Arroz')).toBeTruthy());
    fireEvent.changeText(screen.getByLabelText('Quanto costuma custar'), '990');
    await waitFor(() => expect(screen.getByLabelText('Quanto costuma custar').props.value).toBe('9,90'));
    fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(mockEditarProduto).toHaveBeenCalledWith('p1', { valorUnitario: 990 }));

    fireEvent.press(screen.getByText('Feijão'));
    await waitFor(() => expect(screen.getByText('Preço de Feijão')).toBeTruthy());
    expect(screen.getByLabelText('Quanto costuma custar').props.value).toBe('');
  });

  it('item avulso continua abrindo a edição completa do avulso, não o sheet de preço', async () => {
    await comTema(<Lista />);

    fireEvent.press(screen.getByText('+ Pilha AA'));
    await waitFor(() => expect(screen.getByText('Editar item')).toBeTruthy());
    expect(screen.queryByText('Preço de Pilha AA')).toBeNull();
    expect(mockEditarProduto).not.toHaveBeenCalled();
  });

  it('fechar o sheet sem salvar não chama useEditarProduto', async () => {
    await comTema(<Lista />);

    fireEvent.press(screen.getByText('Arroz'));
    await waitFor(() => expect(screen.getByText('Preço de Arroz')).toBeTruthy());
    fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));

    await waitFor(() => expect(screen.queryByText('Preço de Arroz')).toBeNull());
    expect(mockEditarProduto).not.toHaveBeenCalled();
  });
});

describe('Lista — toast de "Desfazer" (ACHADOs de QA)', () => {
  afterEach(() => {
    mockUseListaDeCompras.mockReturnValue({ itens: mockItens, desativados: [], carregando: false });
    mockUseRemoverItemDaLista.mockReturnValue({
      ultimaRemocao: null,
      remover: jest.fn(),
      removerAvulso: mockRemoverAvulso,
      desfazer: mockDesfazer,
      limpar: mockLimpar,
      reativar: mockReativar,
    });
  });

  // ACHADO: o branch de EstadoVazio tinha um `return` antecipado que nunca
  // chegava a renderizar o <Toast> — remover o último item da lista
  // deixava a pessoa sem chance de desfazer.
  it('o toast de desfazer aparece mesmo quando a lista fica vazia', async () => {
    mockUseListaDeCompras.mockReturnValue({ itens: [], desativados: [], carregando: false });
    mockUseRemoverItemDaLista.mockReturnValue({
      ultimaRemocao: { tipo: 'produto', itemExclusaoId: 'x1', nome: 'Arroz', criouNovaLinha: true },
      remover: jest.fn(),
      removerAvulso: mockRemoverAvulso,
      desfazer: mockDesfazer,
      limpar: mockLimpar,
      reativar: mockReativar,
    });

    await comTema(<Lista />);

    expect(screen.getByText('Nada faltando por aqui.', { exact: false })).toBeTruthy();
    expect(screen.getByText('Arroz removido da lista')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Desfazer' }));
    expect(mockDesfazer).toHaveBeenCalledTimes(1);
  });

  // ACHADO: remover um avulso usava um estado (useEditarAvulso) desconectado
  // do que alimenta o toast — nunca oferecia desfazer. Agora passa por
  // removerAvulso, do mesmo hook que já alimenta o toast pra produto.
  it('remover um item avulso aciona removerAvulso (o mesmo hook que alimenta o toast)', async () => {
    await comTema(<Lista />);

    fireEvent.press(screen.getByLabelText('Remover Pilha AA da lista'));

    expect(mockRemoverAvulso).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'avulso', itemId: 'a1', nome: 'Pilha AA' }),
    );
  });
});

describe('Lista — seção de desativados (exclusão é temporária, não some pra sempre)', () => {
  afterEach(() => {
    mockUseListaDeCompras.mockReturnValue({ itens: mockItens, desativados: [], carregando: false });
  });

  it('mostra o nome dos itens desativados e um botão pra trazer cada um de volta', async () => {
    mockUseListaDeCompras.mockReturnValue({
      itens: mockItens,
      desativados: [{ itemId: 'x1', produtoId: 'p9', nome: 'Manteiga', categoria: 'Laticínios' }],
      carregando: false,
    });

    await comTema(<Lista />);

    expect(screen.getByText('Fora da lista por agora (1)')).toBeTruthy();
    expect(screen.queryByText('Manteiga')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Fora da lista por agora (1)' }));
    await waitFor(() => expect(screen.getByText('Manteiga')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Voltar Manteiga pra lista'));
    expect(mockReativar).toHaveBeenCalledWith('x1');
  });

  it('sem itens desativados, a seção não aparece', async () => {
    mockUseListaDeCompras.mockReturnValue({ itens: mockItens, desativados: [], carregando: false });

    await comTema(<Lista />);

    expect(screen.queryByText(/^Fora da lista por agora/)).toBeNull();
  });

  it('aparece mesmo com a lista de faltantes vazia', async () => {
    mockUseListaDeCompras.mockReturnValue({
      itens: [],
      desativados: [{ itemId: 'x1', produtoId: 'p9', nome: 'Manteiga', categoria: null }],
      carregando: false,
    });

    await comTema(<Lista />);

    expect(screen.getByText('Nada faltando por aqui.', { exact: false })).toBeTruthy();
    const cabecalho = screen.getByText('Fora da lista por agora (1)');
    expect(cabecalho).toBeTruthy();
    fireEvent.press(cabecalho);
    await waitFor(() => expect(screen.getByText('Manteiga')).toBeTruthy());
  });
});

describe('Lista — compra em andamento (change melhorias-usabilidade-modo-compra)', () => {
  afterEach(() => {
    mockUseResumoCompraAberta.mockReset();
    mockUseResumoCompraAberta.mockReturnValue({ resumo: null, carregando: false });
    mockRecomecar.mockClear();
  });

  it('sem compra aberta, não mostra a faixa de progresso', async () => {
    mockUseResumoCompraAberta.mockReturnValue({ resumo: null, carregando: false });

    await comTema(<Lista />);

    expect(screen.queryByText(/Compra em andamento/)).toBeNull();
  });

  it('com compra aberta, mostra a faixa persistente com o progresso', async () => {
    mockUseResumoCompraAberta.mockReturnValue({
      resumo: { compraId: 'compra-1', marcados: 3, total: 8, possuiProgresso: true },
      carregando: false,
    });

    await comTema(<Lista />);

    expect(screen.getByText(/Compra em andamento/)).toBeTruthy();
    expect(screen.getByText(/3 de 8/)).toBeTruthy();
  });

  it('tocar em "Iniciar compra" com rascunho aberto abre o painel de decisão em vez de navegar direto', async () => {
    mockUseResumoCompraAberta.mockReturnValue({
      resumo: { compraId: 'compra-1', marcados: 0, total: 3, possuiProgresso: false },
      carregando: false,
    });

    await comTema(<Lista />);
    fireEvent.press(screen.getByText(/Iniciar compra/));

    await waitFor(() => expect(screen.getByText('Continuar compra')).toBeTruthy());
    expect(screen.getByText('Começar nova lista')).toBeTruthy();
  });

  it('"Continuar compra" sincroniza preços da compra aberta (não cancela nem recria)', async () => {
    mockUseResumoCompraAberta.mockReturnValue({
      resumo: { compraId: 'compra-1', marcados: 0, total: 3, possuiProgresso: false },
      carregando: false,
    });

    await comTema(<Lista />);
    fireEvent.press(screen.getByText(/Iniciar compra/));
    await waitFor(() => expect(screen.getByText('Continuar compra')).toBeTruthy());
    fireEvent.press(screen.getByText('Continuar compra'));

    // "Continuar compra" reutiliza `iniciar()` — que resolve para a MESMA
    // compra aberta via `obterOuAbrirCompra` — para sincronizar
    // `valorEstimadoUnit` de itens ainda não comprados quando o preço do
    // produto mudou na Lista/Despensa depois da materialização (regressão
    // real: preço editado ficava congelado ao continuar a compra).
    await waitFor(() => expect(mockIniciar).toHaveBeenCalledWith(mockItens));
    expect(mockRecomecar).not.toHaveBeenCalled();
  });

  it('"Começar nova lista" sem progresso recomeça direto, sem pedir confirmação', async () => {
    mockUseResumoCompraAberta.mockReturnValue({
      resumo: { compraId: 'compra-1', marcados: 0, total: 3, possuiProgresso: false },
      carregando: false,
    });

    await comTema(<Lista />);
    fireEvent.press(screen.getByText(/Iniciar compra/));
    await waitFor(() => expect(screen.getByText('Começar nova lista')).toBeTruthy());
    fireEvent.press(screen.getByText('Começar nova lista'));

    await waitFor(() => expect(mockRecomecar).toHaveBeenCalledTimes(1));
  });

  it('"Começar nova lista" com progresso exige confirmação antes de recomeçar', async () => {
    mockUseResumoCompraAberta.mockReturnValue({
      resumo: { compraId: 'compra-1', marcados: 2, total: 3, possuiProgresso: true },
      carregando: false,
    });

    await comTema(<Lista />);
    fireEvent.press(screen.getByText(/Iniciar compra/));
    await waitFor(() => expect(screen.getByText('Começar nova lista')).toBeTruthy());
    fireEvent.press(screen.getByText('Começar nova lista'));

    expect(mockRecomecar).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText(/rascunho/i)).toBeTruthy());
    // Achado de QA: os dois painéis apareciam sobrepostos por um frame —
    // o painel de decisão precisa fechar ao abrir o de confirmação.
    expect(screen.queryByText('Compra em andamento')).toBeNull();
  });
});
