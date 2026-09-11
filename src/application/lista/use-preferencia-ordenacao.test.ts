import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { ConfiguracaoRepositorioFalso } from '../backup/teste/configuracao-repositorio-falso';
import { usePreferenciaDeOrdenacao } from './use-preferencia-ordenacao';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  configuracaoRepository: undefined,
}));

afterEach(cleanup);

describe('usePreferenciaDeOrdenacao', () => {
  it('sem valor salvo, o padrão é alfabética', async () => {
    const repositorio = new ConfiguracaoRepositorioFalso();

    const { result } = await renderHook(() => usePreferenciaDeOrdenacao(repositorio));

    await waitFor(() => expect(result.current.modo).toBe('alfabetica'));
  });

  it('leitura inicial reflete o valor já gravado no repositório', async () => {
    const repositorio = new ConfiguracaoRepositorioFalso();
    await repositorio.gravar('casa-teste', 'ordenacaoDaDespensa', 'estado');

    const { result } = await renderHook(() => usePreferenciaDeOrdenacao(repositorio));

    await waitFor(() => expect(result.current.modo).toBe('estado'));
  });

  it('selecionar(modo) grava e atualiza o valor', async () => {
    const repositorio = new ConfiguracaoRepositorioFalso();
    const { result } = await renderHook(() => usePreferenciaDeOrdenacao(repositorio));
    await waitFor(() => expect(result.current.modo).toBe('alfabetica'));

    await act(async () => {
      await result.current.selecionar('estado');
    });

    expect(result.current.modo).toBe('estado');
    await expect(repositorio.ler('casa-teste', 'ordenacaoDaDespensa')).resolves.toBe('estado');
  });

  it('cada uma das 4 opções pode ser selecionada e persiste independentemente', async () => {
    const repositorio = new ConfiguracaoRepositorioFalso();
    const { result } = await renderHook(() => usePreferenciaDeOrdenacao(repositorio));
    await waitFor(() => expect(result.current.modo).toBe('alfabetica'));

    for (const modo of ['alfabeticaInversa', 'estado', 'estadoInverso', 'alfabetica'] as const) {
      await act(async () => {
        await result.current.selecionar(modo);
      });
      expect(result.current.modo).toBe(modo);
      await expect(repositorio.ler('casa-teste', 'ordenacaoDaDespensa')).resolves.toBe(modo);
    }
  });
});
