import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { useApagarTodosOsDados } from './use-apagar-todos-os-dados';

const mockApagarTodosOsDados = jest.fn();

jest.mock('../../composicao/repositorios', () => ({
  apagarTodosOsDados: () => mockApagarTodosOsDados(),
}));

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('useApagarTodosOsDados', () => {
  it('começa ocioso e cancelar não chama a função de reset', async () => {
    const { result } = await renderHook(() => useApagarTodosOsDados());

    expect(result.current.estado).toEqual({ fase: 'ocioso' });

    await act(async () => {
      result.current.cancelar();
    });

    expect(result.current.estado).toEqual({ fase: 'ocioso' });
    expect(mockApagarTodosOsDados).not.toHaveBeenCalled();
  });

  it('pedirConfirmacao leva o estado para confirmando, sem chamar o reset', async () => {
    const { result } = await renderHook(() => useApagarTodosOsDados());

    await act(async () => {
      result.current.pedirConfirmacao();
    });

    expect(result.current.estado).toEqual({ fase: 'confirmando' });
    expect(mockApagarTodosOsDados).not.toHaveBeenCalled();
  });

  it('cancelar depois de confirmando volta a ocioso sem chamar o reset', async () => {
    const { result } = await renderHook(() => useApagarTodosOsDados());

    await act(async () => {
      result.current.pedirConfirmacao();
    });
    await act(async () => {
      result.current.cancelar();
    });

    expect(result.current.estado).toEqual({ fase: 'ocioso' });
    expect(mockApagarTodosOsDados).not.toHaveBeenCalled();
  });

  it('confirmar chama o reset e leva o estado para concluido', async () => {
    const { result } = await renderHook(() => useApagarTodosOsDados());

    await act(async () => {
      result.current.pedirConfirmacao();
    });
    await act(async () => {
      await result.current.confirmar();
    });

    await waitFor(() => expect(result.current.estado).toEqual({ fase: 'concluido' }));
    expect(mockApagarTodosOsDados).toHaveBeenCalledTimes(1);
  });

  it('erro no reset leva o estado para erro com a mensagem de tentar de novo', async () => {
    mockApagarTodosOsDados.mockImplementation(() => {
      throw new Error('falha de I/O do SQLite');
    });
    const { result } = await renderHook(() => useApagarTodosOsDados());

    await act(async () => {
      result.current.pedirConfirmacao();
    });
    await act(async () => {
      await result.current.confirmar();
    });

    expect(result.current.estado).toEqual({
      fase: 'erro',
      mensagem: 'Não foi possível apagar. Toque para tentar de novo.',
    });
  });
});
