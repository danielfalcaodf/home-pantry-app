import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { ConfiguracaoRepositorioFalso } from './teste/configuracao-repositorio-falso';
import { useUltimoBackup } from './use-ultimo-backup';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  configuracaoRepository: undefined,
}));

afterEach(cleanup);

describe('useUltimoBackup', () => {
  it('carrega vazio quando nunca houve backup', async () => {
    const { result } = await renderHook(() => useUltimoBackup(new ConfiguracaoRepositorioFalso()));
    await waitFor(() => expect(result.current.ultimoBackupEm).toBe(''));
  });

  it('carrega a data persistida', async () => {
    const configuracoes = new ConfiguracaoRepositorioFalso();
    await configuracoes.gravar('casa-teste', 'ultimoBackupEm', '1700000000000');
    const { result } = await renderHook(() => useUltimoBackup(configuracoes));
    await waitFor(() => expect(result.current.ultimoBackupEm).toBe('1700000000000'));
  });

  it('recarregar busca o valor mais recente', async () => {
    const configuracoes = new ConfiguracaoRepositorioFalso();
    const { result } = await renderHook(() => useUltimoBackup(configuracoes));
    await waitFor(() => expect(result.current.ultimoBackupEm).toBe(''));

    await configuracoes.gravar('casa-teste', 'ultimoBackupEm', '2000');
    await act(async () => {
      await result.current.recarregar();
    });

    expect(result.current.ultimoBackupEm).toBe('2000');
  });
});
