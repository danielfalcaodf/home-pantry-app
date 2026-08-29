import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { ReactNode } from 'react';
import * as mockReact from 'react';
import { Alert } from 'react-native';

import { ThemeProvider } from '@/presentation/theme/provider';
import ModoCompra from './[id]';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseKeepAwake = jest.fn();
const mockFinalizar = jest.fn();
const mockCancelar = jest.fn();
const mockDivergencias = jest.fn(async () => [] as unknown[]);

jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), replace: (...a: unknown[]) => mockReplace(...a) },
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ id: 'compra-1' }),
}));

jest.mock('expo-keep-awake', () => ({
  useKeepAwake: () => mockUseKeepAwake(),
}));

jest.mock('@/application/lista/use-preferencia-agrupamento', () => ({
  usePreferenciaDeAgrupamento: () => ({ agrupado: true, alternar: jest.fn() }),
}));

let mockCarregando = false;

let mockItensIniciais: {
  item: {
    id: string;
    compraId: string;
    produtoId: string | null;
    nomeAvulso: string | null;
    unidade: string;
    quantidadePlanejada: number;
    quantidadeComprada: number | null;
    valorEstimadoUnit: number;
    valorPagoUnitario: number | null;
    comprado: boolean;
    ordem: number;
    excluido: boolean;
    atualizarPreco: boolean | null;
  };
  produto: { nome: string } | null;
  divergePreco: boolean;
}[] = [];

jest.mock('@/application/compra/use-modo-compra', () => ({
  useModoCompra: () => {
    const [itens, setItens] = mockReact.useState(mockItensIniciais);
    const marcar = mockReact.useCallback(
      async ({ item }: { item: { id: string } }) =>
        setItens((atual: typeof mockItensIniciais) =>
          atual.map((linha) =>
            linha.item.id === item.id
              ? { ...linha, item: { ...linha.item, comprado: true, quantidadeComprada: linha.item.quantidadePlanejada } }
              : linha,
          ),
        ),
      [],
    );
    const desmarcar = mockReact.useCallback(
      async (itemId: string) =>
        setItens((atual: typeof mockItensIniciais) =>
          atual.map((linha) => (linha.item.id === itemId ? { ...linha, item: { ...linha.item, comprado: false } } : linha)),
        ),
      [],
    );
    return {
      itens,
      carregando: mockCarregando,
      marcar,
      desmarcar,
      ajustarQuantidade: async () => {},
      ajustarQuantidadeRapida: async () => {},
      ajustarPreco: async () => {},
      responderAtualizarPreco: async () => {},
    };
  },
}));

jest.mock('@/application/compra/use-finalizar-compra', () => ({
  useFinalizarCompra: () => ({ finalizando: false, divergencias: mockDivergencias, finalizar: mockFinalizar }),
}));

jest.mock('@/application/compra/use-cancelar-compra', () => ({
  useCancelarCompra: () => ({ cancelando: false, cancelar: mockCancelar }),
}));

function itemFake(id: string, nome: string, comprado = false) {
  return {
    item: {
      id,
      compraId: 'compra-1',
      produtoId: `p-${id}`,
      nomeAvulso: null,
      unidade: 'un' as const,
      quantidadePlanejada: 1000,
      quantidadeComprada: comprado ? 1000 : null,
      valorEstimadoUnit: 500,
      valorPagoUnitario: comprado ? 500 : null,
      comprado,
      ordem: 0,
      excluido: false,
      atualizarPreco: null,
    },
    produto: { nome },
    divergePreco: false,
  };
}

async function comTema(no: ReactNode) {
  return render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('ModoCompra (app/compra/[id].tsx)', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockUseKeepAwake.mockClear();
    mockFinalizar.mockReset();
    mockCancelar.mockReset();
    mockCarregando = false;
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ACHADO-035 (task 5.2): a tela mantém o aparelho acordado enquanto
  // montada — sem isso, o celular apaga a tela no meio das compras.
  it('mantém o aparelho acordado (useKeepAwake) enquanto montada', async () => {
    mockItensIniciais = [itemFake('i1', 'Arroz')];
    await comTema(<ModoCompra />);
    expect(mockUseKeepAwake).toHaveBeenCalled();
  });

  // Achado de QA: a tela ficava totalmente em branco (`return null`) enquanto
  // `carregando` era true — crítico logo após "Começar nova lista", quando a
  // navegação chega antes do primeiro carregamento da compra recém-criada.
  it('não fica em branco enquanto os itens ainda carregam — mostra a estrutura da tela', async () => {
    mockCarregando = true;
    mockItensIniciais = [];
    await comTema(<ModoCompra />);
    expect(screen.getByText('Compra')).toBeTruthy();
    expect(
      screen.getByText('Toque em cada item para marcar. Se sair, a compra continua aberta com o que você já marcou.'),
    ).toBeTruthy();
  });

  it('item já no piso de quantidade (1 un) chega com o controle de diminuir desabilitado', async () => {
    mockItensIniciais = [itemFake('i1', 'Arroz')];
    await comTema(<ModoCompra />);
    const botaoDiminuir = screen.getByRole('button', { name: 'Diminuir quantidade de Arroz' });
    expect(botaoDiminuir.props.accessibilityState.disabled).toBe(true);
  });

  // ACHADO-035 (task 5.1): marcar/ajustar não navega — tela única (D3).
  it('marcar um item não dispara nenhuma navegação', async () => {
    mockItensIniciais = [itemFake('i1', 'Arroz'), itemFake('i2', 'Feijão')];
    await comTema(<ModoCompra />);
    fireEvent.press(screen.getByRole('checkbox', { name: /Arroz/ }));
    await waitFor(() => expect(screen.getByRole('checkbox', { name: /Arroz/ }).props.accessibilityState.checked).toBe(true));
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  // ACHADO-035 (task 5.3): rodapé (contador e total) atualiza a cada marcação.
  it('rodapé atualiza contador e total a cada marcação', async () => {
    mockItensIniciais = [itemFake('i1', 'Arroz'), itemFake('i2', 'Feijão')];
    await comTema(<ModoCompra />);
    expect(screen.getByText('0 de 2')).toBeTruthy();

    fireEvent.press(screen.getByRole('checkbox', { name: /Arroz/ }));
    await waitFor(() => expect(screen.getByText('1 de 2')).toBeTruthy());
    // Total do rodapé (500) bate com o preço do próprio Arroz marcado —
    // por isso duas ocorrências do mesmo texto (linha do item + rodapé).
    expect(screen.getAllByText('R$ 5,00')).toHaveLength(2);
  });

  // ACHADO-034 (task 3.1): cancelar o aviso mantém a tela e preserva marcações.
  it('cancelar o aviso de saída ("Manter") preserva as marcações e não navega', async () => {
    mockItensIniciais = [itemFake('i1', 'Arroz')];
    await comTema(<ModoCompra />);
    fireEvent.press(screen.getByRole('checkbox', { name: /Arroz/ }));
    await waitFor(() => expect(screen.getByRole('checkbox', { name: /Arroz/ }).props.accessibilityState.checked).toBe(true));

    fireEvent.press(screen.getByLabelText('Voltar'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Sair da compra?',
      'A compra continua aberta com o que você já marcou.',
      expect.any(Array),
    );
    const botoes = (Alert.alert as jest.Mock).mock.calls.at(-1)?.[2] as { text: string; onPress?: () => void }[];
    botoes.find((botao) => botao.text === 'Manter')?.onPress?.();

    expect(mockBack).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: /Arroz/ }).props.accessibilityState.checked).toBe(true);
  });

  // ACHADO-034 (task 3.2): desmarcar tudo volta a "sem confirmação".
  it('desmarcar todos os itens volta o Voltar a sair direto, sem aviso', async () => {
    mockItensIniciais = [itemFake('i1', 'Arroz')];
    await comTema(<ModoCompra />);
    fireEvent.press(screen.getByRole('checkbox', { name: /Arroz/ }));
    await waitFor(() => expect(screen.getByRole('checkbox', { name: /Arroz/ }).props.accessibilityState.checked).toBe(true));

    fireEvent.press(screen.getByRole('checkbox', { name: /Arroz/ }));
    await waitFor(() => expect(screen.getByRole('checkbox', { name: /Arroz/ }).props.accessibilityState.checked).toBe(false));

    fireEvent.press(screen.getByLabelText('Voltar'));
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  // ACHADO-035 (tasks 5.4/5.5): mensagem em linguagem do usuário e retorno
  // à despensa após o toast de sucesso terminar.
  it('fechar a compra mostra "Você repôs N itens" e volta à despensa após o toast', async () => {
    jest.useFakeTimers();
    mockItensIniciais = [itemFake('i1', 'Arroz', true)];
    mockFinalizar.mockResolvedValue({ ok: true, itensRepostos: 2 });
    await comTema(<ModoCompra />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Fechar compra'));
    });
    await waitFor(() => expect(screen.getByText('Você repôs 2 itens')).toBeTruthy());
    expect(mockReplace).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(mockReplace).toHaveBeenCalledWith('/');
    jest.useRealTimers();
  });

  it('fechar a compra com 1 item reposto usa singular: "Você repôs 1 item"', async () => {
    mockItensIniciais = [itemFake('i1', 'Arroz', true)];
    mockFinalizar.mockResolvedValue({ ok: true, itensRepostos: 1 });
    await comTema(<ModoCompra />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Fechar compra'));
    });
    await waitFor(() => expect(screen.getByText('Você repôs 1 item')).toBeTruthy());
  });

  // ACHADO-052 (task 7.3): RodapeCompra aparece imediatamente acima do botão
  // "Fechar compra", nessa ordem visual, conforme `modo-compra` spec.
  it('RodapeCompra aparece imediatamente antes do botão "Fechar compra" na árvore', async () => {
    mockItensIniciais = [itemFake('i1', 'Arroz')];
    await comTema(<ModoCompra />);

    const arvore = JSON.stringify(screen.toJSON());
    const indiceRodape = arvore.indexOf('R$ 0,00');
    const indiceBotao = arvore.indexOf('Fechar compra');

    expect(indiceRodape).toBeGreaterThan(-1);
    expect(indiceBotao).toBeGreaterThan(indiceRodape);
  });
});

describe('ModoCompra — revisão agrupada de preço no fechamento', () => {
  beforeEach(() => {
    mockFinalizar.mockReset();
    mockFinalizar.mockResolvedValue({ ok: true, itensRepostos: 1 });
    mockDivergencias.mockReset();
    mockDivergencias.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sem divergência de preço, fecha direto sem mostrar revisão', async () => {
    mockItensIniciais = [itemFake('i1', 'Arroz', true)];
    mockDivergencias.mockResolvedValue([]);
    await comTema(<ModoCompra />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Fechar compra'));
    });

    await waitFor(() => expect(mockFinalizar).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/preços diferentes/)).toBeNull();
  });

  it('com divergência, mostra a revisão agrupada em vez de fechar direto', async () => {
    mockItensIniciais = [itemFake('i1', 'Arroz', true)];
    mockDivergencias.mockResolvedValue([
      { itemId: 'i1', produtoId: 'p-i1', nome: 'Arroz', precoSalvo: 500, precoPago: 700, primeiroPreco: false },
    ]);
    await comTema(<ModoCompra />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Fechar compra'));
    });

    await waitFor(() => expect(screen.getByText(/^1 preço diferente$/)).toBeTruthy());
    expect(mockFinalizar).not.toHaveBeenCalled();
  });

  it('"Atualizar N" confirma o fechamento com todos os divergentes selecionados', async () => {
    mockItensIniciais = [itemFake('i1', 'Arroz', true)];
    mockDivergencias.mockResolvedValue([
      { itemId: 'i1', produtoId: 'p-i1', nome: 'Arroz', precoSalvo: 500, precoPago: 700, primeiroPreco: false },
    ]);
    await comTema(<ModoCompra />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Fechar compra'));
    });
    await waitFor(() => expect(screen.getByText(/^1 preço diferente$/)).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByText('Atualizar 1'));
    });

    await waitFor(() => expect(mockFinalizar).toHaveBeenCalledTimes(1));
  });

  it('"Manter preços salvos" confirma o fechamento sem selecionar nenhum', async () => {
    mockItensIniciais = [itemFake('i1', 'Arroz', true)];
    mockDivergencias.mockResolvedValue([
      { itemId: 'i1', produtoId: 'p-i1', nome: 'Arroz', precoSalvo: 500, precoPago: 700, primeiroPreco: false },
    ]);
    await comTema(<ModoCompra />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Fechar compra'));
    });
    await waitFor(() => expect(screen.getByText(/^1 preço diferente$/)).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByText('Manter preços salvos'));
    });

    await waitFor(() => expect(mockFinalizar).toHaveBeenCalledTimes(1));
  });

  it('"Escolher quais atualizar" permite selecionar exceções por produto', async () => {
    mockItensIniciais = [itemFake('i1', 'Arroz', true)];
    mockDivergencias.mockResolvedValue([
      { itemId: 'i1', produtoId: 'p-i1', nome: 'Arroz', precoSalvo: 500, precoPago: 700, primeiroPreco: false },
      { itemId: 'i2', produtoId: 'p-i2', nome: 'Feijão', precoSalvo: 400, precoPago: 450, primeiroPreco: false },
    ]);
    await comTema(<ModoCompra />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Fechar compra'));
    });
    await waitFor(() => expect(screen.getByText(/^2 preços diferentes$/)).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByText('Escolher quais atualizar'));
    });
    // Achado de QA: os dois itens vinham selecionados por padrão, mas sem
    // NENHUM indicador visual — usuário não tinha como saber o que estava
    // marcado só olhando a lista, só pelo contador no botão do rodapé.
    await waitFor(() => expect(screen.getByRole('checkbox', { name: /Feijão/ })).toBeTruthy());
    expect(within(screen.getByRole('checkbox', { name: /Feijão/ })).getByText('✓')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole('checkbox', { name: /Feijão/ }));
    });
    await waitFor(() => expect(screen.getByLabelText('Confirmar 1 selecionado')).toBeTruthy());
    expect(within(screen.getByRole('checkbox', { name: /Feijão/ })).queryByText('✓')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Confirmar 1 selecionado'));
    });

    await waitFor(() => expect(mockFinalizar).toHaveBeenCalledTimes(1));
  });

  it('produto sem preço salvo mostra "sem preço salvo" na revisão', async () => {
    mockItensIniciais = [itemFake('i1', 'Feijão', true)];
    mockDivergencias.mockResolvedValue([
      { itemId: 'i1', produtoId: 'p-i1', nome: 'Feijão', precoSalvo: 0, precoPago: 450, primeiroPreco: true },
    ]);
    await comTema(<ModoCompra />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Fechar compra'));
    });
    await waitFor(() => expect(screen.getByText(/^1 preço diferente$/)).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByText('Escolher quais atualizar'));
    });

    await waitFor(() => expect(screen.getByText(/Sem preço salvo/)).toBeTruthy());
  });

  it('fechar a revisão sem confirmar preserva a compra aberta, sem chamar finalizar', async () => {
    mockItensIniciais = [itemFake('i1', 'Arroz', true)];
    mockDivergencias.mockResolvedValue([
      { itemId: 'i1', produtoId: 'p-i1', nome: 'Arroz', precoSalvo: 500, precoPago: 700, primeiroPreco: false },
    ]);
    await comTema(<ModoCompra />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Fechar compra'));
    });
    await waitFor(() => expect(screen.getByText(/^1 preço diferente$/)).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Fechar'));

    expect(mockFinalizar).not.toHaveBeenCalled();
  });
});
