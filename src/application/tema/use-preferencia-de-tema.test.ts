import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { ConfiguracaoRepositorioFalso } from '../backup/teste/configuracao-repositorio-falso';
import { usePreferenciaDeTemaPersistida } from './use-preferencia-de-tema';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  configuracaoRepository: undefined,
}));

afterEach(cleanup);

describe('usePreferenciaDeTemaPersistida (ACHADO-018)', () => {
  it('escolher uma preferência grava no repositório e atualiza o estado', async () => {
    const repositorio = new ConfiguracaoRepositorioFalso();
    const { result } = await renderHook(() => usePreferenciaDeTemaPersistida(true, repositorio));
    await waitFor(() => expect(result.current.carregada).toBe(true));

    await act(async () => {
      await result.current.escolher('claro');
    });

    expect(result.current.preferencia).toBe('claro');
    await expect(repositorio.ler('casa-teste', 'tema')).resolves.toBe('claro');
  });

  it('uma nova montagem do hook lê a preferência já gravada (sobrevive ao fechamento)', async () => {
    const repositorio = new ConfiguracaoRepositorioFalso();
    await repositorio.gravar('casa-teste', 'tema', 'escuro');

    const { result } = await renderHook(() => usePreferenciaDeTemaPersistida(true, repositorio));

    await waitFor(() => expect(result.current.carregada).toBe(true));
    expect(result.current.preferencia).toBe('escuro');
  });

  it('preferência automática é lida sem gravação redundante no repositório', async () => {
    const repositorio = new ConfiguracaoRepositorioFalso();
    const gravar = jest.spyOn(repositorio, 'gravar');

    const { result } = await renderHook(() => usePreferenciaDeTemaPersistida(true, repositorio));

    await waitFor(() => expect(result.current.carregada).toBe(true));
    expect(result.current.preferencia).toBe('automatico');
    expect(gravar).not.toHaveBeenCalled();
  });

  it('desabilitado (antes das migrations) não lê o repositório', async () => {
    const repositorio = new ConfiguracaoRepositorioFalso();
    const ler = jest.spyOn(repositorio, 'ler');

    const { result, unmount } = await renderHook(() =>
      usePreferenciaDeTemaPersistida(false, repositorio),
    );

    expect(result.current.carregada).toBe(false);
    expect(result.current.preferencia).toBe('automatico');
    expect(ler).not.toHaveBeenCalled();

    await act(async () => {
      unmount();
    });
  });
});
