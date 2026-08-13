import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { ThemeProvider } from '@/presentation/theme/provider';
import ListaBase from './lista-base';

const mockBack = jest.fn();
// Ref mutável lida pelo mock de `expo-router` a cada chamada de `back()` —
// permite trocar o comportamento por teste (task 5.8) sem `resetModules`
// (que quebra a instância única do React entre módulos, ver nota no repo).
let mockBackImpl = () => {};

jest.mock('expo-router', () => ({
  router: { back: () => {
    mockBack();
    mockBackImpl();
  } },
  useRouter: () => ({ back: () => {
    mockBack();
    mockBackImpl();
  } }),
}));

jest.mock('@/application/estoque/use-lista-base', () => ({
  useListaBase: () => ({ itens: [], adotar: jest.fn(), adotando: false, falhou: false }),
}));

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('Lista básica — botão Voltar (ACHADO-049, task 5.3)', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockBackImpl = () => {};
  });

  it('tocar no botão "←" chama router.back(), retornando à Despensa', async () => {
    await comTema(<ListaBase />);
    fireEvent.press(screen.getByLabelText('Voltar'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

// Task 5.8: caso de borda com pilha de navegação com mais de uma entrada —
// `router.back()` só desempilha um nível (volta ao topo anterior), nunca
// pula direto para uma rota fixa via push/replace.
describe('Lista básica — pilha com mais de uma entrada (ACHADO-049, task 5.8)', () => {
  it('com pilha [Despensa, Adicionar produto, Lista básica], back() desempilha só um nível', async () => {
    const pilha = ['/', '/produto/novo', '/produto/lista-base'];
    mockBackImpl = () => {
      if (pilha.length > 1) {
        pilha.pop();
      }
    };
    mockBack.mockClear();

    await comTema(<ListaBase />);
    fireEvent.press(screen.getByLabelText('Voltar'));

    expect(mockBack).toHaveBeenCalledTimes(1);
    // Um único nível desempilhado: volta a "Adicionar produto", não pula
    // direto para a Despensa (o topo real da pilha, não uma rota fixa).
    expect(pilha).toEqual(['/', '/produto/novo']);
  });
});
