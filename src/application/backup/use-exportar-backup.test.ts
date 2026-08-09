import { act, cleanup, renderHook } from '@testing-library/react-native';

import { BackupRepositorioFalso } from './teste/backup-repositorio-falso';
import { ConfiguracaoRepositorioFalso } from './teste/configuracao-repositorio-falso';
import { SistemaDeArquivosFalso } from './teste/sistema-de-arquivos-falso';
import { useExportarBackup } from './use-exportar-backup';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  relogio: { agora: () => 1_700_000_000_000 },
  backupRepository: undefined,
  configuracaoRepository: undefined,
  sistemaDeArquivos: undefined,
}));

afterEach(cleanup);

describe('useExportarBackup', () => {
  it('monta o backup da casa local e grava/compartilha o arquivo', async () => {
    const backups = new BackupRepositorioFalso();
    const configuracoes = new ConfiguracaoRepositorioFalso();
    const arquivos = new SistemaDeArquivosFalso();
    const { result } = await renderHook(() => useExportarBackup(backups, configuracoes, arquivos));

    await act(async () => {
      await result.current.exportar();
    });

    expect(backups.chamadasMontar).toEqual([{ casaId: 'casa-teste', exportadoEm: 1_700_000_000_000 }]);
    expect(arquivos.gravados).toHaveLength(1);
    expect(arquivos.gravados[0].nomeArquivo).toMatch(/^repor-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const conteudo = JSON.parse(arquivos.gravados[0].conteudo);
    expect(conteudo.casa.id).toBe('casa-teste');
  });

  it('grava valores em unidades internas, sem conversão para exibição', async () => {
    const backups = new BackupRepositorioFalso();
    backups.arquivo = {
      ...backups.arquivo,
      produtos: [
        {
          id: 'p1',
          casaId: 'casa-teste',
          nome: 'Arroz',
          categoria: null,
          unidade: 'kg',
          quantidadeAtual: 1500,
          quantidadeNecessaria: 3000,
          valorUnitario: 1290,
          marcaPreferida: null,
          observacao: null,
          ativo: true,
          criadoEm: 0,
          atualizadoEm: 0,
          deletadoEm: null,
          syncStatus: 'local',
        },
      ],
    } as never;
    const arquivos = new SistemaDeArquivosFalso();
    const { result } = await renderHook(() =>
      useExportarBackup(backups, new ConfiguracaoRepositorioFalso(), arquivos),
    );

    await act(async () => {
      await result.current.exportar();
    });

    const conteudo = JSON.parse(arquivos.gravados[0].conteudo);
    expect(conteudo.produtos[0].quantidadeAtual).toBe(1500);
    expect(conteudo.produtos[0].valorUnitario).toBe(1290);
  });

  it('registra a data do último backup na configuração', async () => {
    const configuracoes = new ConfiguracaoRepositorioFalso();
    const { result } = await renderHook(() =>
      useExportarBackup(new BackupRepositorioFalso(), configuracoes, new SistemaDeArquivosFalso()),
    );

    await act(async () => {
      await result.current.exportar();
    });

    expect(await configuracoes.ler('casa-teste', 'ultimoBackupEm')).toBe('1700000000000');
  });

  it('exportando fica falso outra vez ao final', async () => {
    const { result } = await renderHook(() =>
      useExportarBackup(
        new BackupRepositorioFalso(),
        new ConfiguracaoRepositorioFalso(),
        new SistemaDeArquivosFalso(),
      ),
    );

    expect(result.current.exportando).toBe(false);
    await act(async () => {
      await result.current.exportar();
    });
    expect(result.current.exportando).toBe(false);
  });
});
