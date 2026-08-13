import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { ConfiguracaoRepositorioFalso } from '../backup/teste/configuracao-repositorio-falso';
import { usePreferenciaDeAgrupamento } from './use-preferencia-agrupamento';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  configuracaoRepository: undefined,
}));

afterEach(cleanup);

describe('usePreferenciaDeAgrupamento', () => {
  it('leitura inicial reflete o valor já gravado no repositório', async () => {
    const repositorio = new ConfiguracaoRepositorioFalso();
    await repositorio.gravar('casa-teste', 'agrupamentoDaLista', 'continuo');

    const { result } = await renderHook(() => usePreferenciaDeAgrupamento(repositorio));

    await waitFor(() => expect(result.current.agrupado).toBe(false));
  });

  it('sem valor salvo, o padrão é agrupado', async () => {
    const repositorio = new ConfiguracaoRepositorioFalso();

    const { result } = await renderHook(() => usePreferenciaDeAgrupamento(repositorio));

    await waitFor(() => expect(result.current.agrupado).toBe(true));
  });

  it('alternar() inverte o valor e persiste no repositório', async () => {
    const repositorio = new ConfiguracaoRepositorioFalso();
    const { result } = await renderHook(() => usePreferenciaDeAgrupamento(repositorio));
    await waitFor(() => expect(result.current.agrupado).toBe(true));

    await act(async () => {
      await result.current.alternar();
    });

    expect(result.current.agrupado).toBe(false);
    await expect(repositorio.ler('casa-teste', 'agrupamentoDaLista')).resolves.toBe('continuo');
  });

  it('alternar duas vezes retorna ao valor original, persistido a cada troca', async () => {
    const repositorio = new ConfiguracaoRepositorioFalso();
    const { result } = await renderHook(() => usePreferenciaDeAgrupamento(repositorio));
    await waitFor(() => expect(result.current.agrupado).toBe(true));

    await act(async () => {
      await result.current.alternar();
    });
    await act(async () => {
      await result.current.alternar();
    });

    expect(result.current.agrupado).toBe(true);
    await expect(repositorio.ler('casa-teste', 'agrupamentoDaLista')).resolves.toBe('agrupado');
  });
});
