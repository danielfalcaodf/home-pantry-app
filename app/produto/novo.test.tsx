import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { LIMITE_SANIDADE_QUANTIDADE } from '@/presentation/components/formulario-produto';
import { ThemeProvider } from '@/presentation/theme/provider';
import NovoProduto from './novo';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCadastrar = jest.fn().mockResolvedValue({ ok: true });

jest.mock('expo-router', () => ({
  router: { back: () => mockBack(), replace: (...a: unknown[]) => mockReplace(...a) },
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('@/application/estoque/use-cadastrar-produto', () => ({
  useCadastrarProduto: () => ({ cadastrar: mockCadastrar, salvando: false }),
}));
jest.mock('@/application/estoque/use-categorias', () => ({ useCategorias: () => [] }));

const mockItens = [
  {
    produto: { id: 'p-arroz', nome: 'Arroz' },
  },
];

jest.mock('@/application/estoque/use-produtos', () => ({
  useProdutos: () => ({ itens: mockItens, carregando: false }),
}));

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('Novo produto — navegação "ver item existente" na duplicidade (ACHADO-024)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockBack.mockClear();
    mockReplace.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('nome duplicado (mesmo ignorando acento/caixa) mostra a ação "Ver o item"', async () => {
    await comTema(<NovoProduto />);

    fireEvent.changeText(screen.getByLabelText('O que é'), 'arroz');

    await waitFor(() => {
      jest.advanceTimersByTime(400);
    });
    await waitFor(() =>
      expect(screen.getByText('Já existe um item chamado Arroz na sua despensa.')).toBeTruthy(),
    );
    expect(screen.getByText('Ver o item')).toBeTruthy();
  });

  it('tocar "Ver o item" navega para /produto/[id] com o id do produto duplicado', async () => {
    await comTema(<NovoProduto />);

    fireEvent.changeText(screen.getByLabelText('O que é'), 'arroz');
    await waitFor(() => {
      jest.advanceTimersByTime(400);
    });
    await waitFor(() => expect(screen.getByText('Ver o item')).toBeTruthy());

    fireEvent.press(screen.getByText('Ver o item'));

    expect(mockReplace).toHaveBeenCalledWith('/produto/p-arroz');
  });

  it('nome sem duplicidade não mostra o aviso', async () => {
    await comTema(<NovoProduto />);

    fireEvent.changeText(screen.getByLabelText('O que é'), 'Feijão');
    await waitFor(() => {
      jest.advanceTimersByTime(400);
    });

    expect(screen.queryByText(/Já existe um item/)).toBeNull();
  });
});

describe('Novo produto — teto de sanidade em "Quanto quero ter em casa" (Error Prevention)', () => {
  beforeEach(() => {
    mockCadastrar.mockClear();
  });

  it('valor acima do teto é rejeitado com erro em texto, sem chamar cadastrar', async () => {
    await comTema(<NovoProduto />);

    fireEvent.changeText(screen.getByLabelText('O que é'), 'Arroz');
    await waitFor(() => expect(screen.getByLabelText('O que é').props.value).toBe('Arroz'));

    fireEvent.changeText(
      screen.getByLabelText('Quanto quero ter em casa'),
      String(LIMITE_SANIDADE_QUANTIDADE + 1),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Quanto quero ter em casa').props.value).toBe(
        String(LIMITE_SANIDADE_QUANTIDADE + 1),
      ),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Adicionar à despensa' }));

    await waitFor(() =>
      expect(screen.getByText(`Valor muito alto — no máximo ${LIMITE_SANIDADE_QUANTIDADE}`)).toBeTruthy(),
    );
    expect(mockCadastrar).not.toHaveBeenCalled();
  });
});
