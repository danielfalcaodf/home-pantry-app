import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { VERSAO_SCHEMA_BACKUP_ATUAL } from '../../domain/backup/backup.schema';
import { arquivoBackupFalso, BackupRepositorioFalso } from './teste/backup-repositorio-falso';
import { MovimentoRepositorioFalso } from './teste/movimento-repositorio-falso';
import { SistemaDeArquivosFalso } from './teste/sistema-de-arquivos-falso';
import { useRestaurarBackup } from './use-restaurar-backup';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  relogio: { agora: () => 1_700_000_000_000 },
  backupRepository: undefined,
  movimentoRepository: undefined,
  sistemaDeArquivos: undefined,
}));

afterEach(cleanup);

function montar(sobrescreveArquivos?: Partial<SistemaDeArquivosFalso>) {
  const backups = new BackupRepositorioFalso();
  const movimentos = new MovimentoRepositorioFalso();
  const arquivos = new SistemaDeArquivosFalso();
  Object.assign(arquivos, sobrescreveArquivos);
  return { backups, movimentos, arquivos };
}

describe('useRestaurarBackup', () => {
  it('cancelado no seletor do sistema não altera o estado', async () => {
    const { backups, movimentos, arquivos } = montar({ arquivoParaSelecionar: null });
    const { result } = await renderHook(() => useRestaurarBackup(backups, movimentos, arquivos));

    await act(async () => {
      await result.current.selecionar();
    });

    expect(result.current.estado).toEqual({ fase: 'ocioso' });
    expect(backups.chamadasRestaurar).toHaveLength(0);
  });

  it('arquivo malformado é recusado antes de qualquer escrita', async () => {
    const { backups, movimentos, arquivos } = montar({
      arquivoParaSelecionar: { uri: 'file://ruim.json', nome: 'ruim.json' },
      textosPorUri: { 'file://ruim.json': '{"nao":"eh um backup"}' },
    });
    const { result } = await renderHook(() => useRestaurarBackup(backups, movimentos, arquivos));

    await act(async () => {
      await result.current.selecionar();
    });

    expect(result.current.estado).toEqual({
      fase: 'erro',
      mensagem: 'Este arquivo não é um backup válido.',
    });
    expect(backups.chamadasRestaurar).toHaveLength(0);
  });

  it('texto que não é JSON válido é recusado com a mesma mensagem', async () => {
    const { backups, movimentos, arquivos } = montar({
      arquivoParaSelecionar: { uri: 'file://ruim.json', nome: 'ruim.json' },
      textosPorUri: { 'file://ruim.json': 'isto não é json' },
    });
    const { result } = await renderHook(() => useRestaurarBackup(backups, movimentos, arquivos));

    await act(async () => {
      await result.current.selecionar();
    });

    expect(result.current.estado).toEqual({
      fase: 'erro',
      mensagem: 'Este arquivo não é um backup válido.',
    });
  });

  it('backup de versão mais nova é recusado com o texto de FRONTEND §11', async () => {
    const arquivo = arquivoBackupFalso({ versaoSchema: VERSAO_SCHEMA_BACKUP_ATUAL + 1 });
    const { backups, movimentos, arquivos } = montar({
      arquivoParaSelecionar: { uri: 'file://futuro.json', nome: 'futuro.json' },
      textosPorUri: { 'file://futuro.json': JSON.stringify(arquivo) },
    });
    const { result } = await renderHook(() => useRestaurarBackup(backups, movimentos, arquivos));

    await act(async () => {
      await result.current.selecionar();
    });

    expect(result.current.estado).toEqual({
      fase: 'erro',
      mensagem: 'O backup é de uma versão mais nova do app. Atualize antes de restaurar.',
    });
  });

  it('backup válido apresenta a confirmação com a data e a contagem de registros', async () => {
    const arquivo = arquivoBackupFalso({
      exportadoEm: 555,
      produtos: [
        {
          id: 'p1',
          casaId: 'casa-do-backup',
          nome: 'Arroz',
          categoria: null,
          unidade: 'kg',
          quantidadeAtual: 1000,
          quantidadeNecessaria: 2000,
          valorUnitario: 500,
          marcaPreferida: null,
          observacao: null,
          ativo: true,
          criadoEm: 0,
          atualizadoEm: 0,
          deletadoEm: null,
          syncStatus: 'sincronizado',
        },
      ] as never,
    });
    const { backups, movimentos, arquivos } = montar({
      arquivoParaSelecionar: { uri: 'file://bom.json', nome: 'bom.json' },
      textosPorUri: { 'file://bom.json': JSON.stringify(arquivo) },
    });
    const { result } = await renderHook(() => useRestaurarBackup(backups, movimentos, arquivos));

    await act(async () => {
      await result.current.selecionar();
    });

    expect(result.current.estado).toMatchObject({
      fase: 'confirmando',
      resumo: { exportadoEm: 555, totalProdutos: 1, totalUsuarios: 1 },
    });
    expect(backups.chamadasRestaurar).toHaveLength(0);
  });

  it('cancelar na confirmação volta a ocioso sem nenhuma escrita', async () => {
    const arquivo = arquivoBackupFalso();
    const { backups, movimentos, arquivos } = montar({
      arquivoParaSelecionar: { uri: 'file://bom.json', nome: 'bom.json' },
      textosPorUri: { 'file://bom.json': JSON.stringify(arquivo) },
    });
    const { result } = await renderHook(() => useRestaurarBackup(backups, movimentos, arquivos));

    await act(async () => {
      await result.current.selecionar();
    });
    expect(result.current.estado.fase).toBe('confirmando');

    await act(async () => {
      result.current.cancelar();
    });

    expect(result.current.estado).toEqual({ fase: 'ocioso' });
    expect(backups.chamadasRestaurar).toHaveLength(0);
  });

  it('confirmar aplica a restauração e roda a reconciliação ao final', async () => {
    const arquivo = arquivoBackupFalso();
    const { backups, movimentos, arquivos } = montar({
      arquivoParaSelecionar: { uri: 'file://bom.json', nome: 'bom.json' },
      textosPorUri: { 'file://bom.json': JSON.stringify(arquivo) },
    });
    const { result } = await renderHook(() => useRestaurarBackup(backups, movimentos, arquivos));

    await act(async () => {
      await result.current.selecionar();
    });
    await act(async () => {
      await result.current.confirmar();
    });

    await waitFor(() => expect(result.current.estado.fase).toBe('concluido'));
    expect(backups.chamadasRestaurar).toHaveLength(1);
    expect(backups.chamadasRestaurar[0]).toMatchObject({
      casaIdLocal: 'casa-teste',
      aplicadoEm: 1_700_000_000_000,
    });
    expect(movimentos.chamadasReconciliar).toEqual(['casa-teste']);
    expect(result.current.estado).toEqual({ fase: 'concluido', divergencias: [] });
  });

  it('falha na restauração preserva a mensagem de tentar de novo, sem estado parcial visível', async () => {
    const arquivo = arquivoBackupFalso();
    const { backups, movimentos, arquivos } = montar({
      arquivoParaSelecionar: { uri: 'file://bom.json', nome: 'bom.json' },
      textosPorUri: { 'file://bom.json': JSON.stringify(arquivo) },
    });
    backups.falharAoRestaurar = new Error('FOREIGN KEY constraint failed');
    const { result } = await renderHook(() => useRestaurarBackup(backups, movimentos, arquivos));

    await act(async () => {
      await result.current.selecionar();
    });
    await act(async () => {
      await result.current.confirmar();
    });

    expect(result.current.estado).toEqual({
      fase: 'erro',
      mensagem: 'Não foi possível restaurar. Toque para tentar de novo.',
    });
    expect(movimentos.chamadasReconciliar).toHaveLength(0);
  });
});
