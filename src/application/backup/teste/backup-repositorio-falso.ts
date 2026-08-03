import { ArquivoBackup, VERSAO_SCHEMA_BACKUP_ATUAL } from '../../../domain/backup/backup.schema';
import { BackupRepository } from '../../../ports/backup.repository';

export function arquivoBackupFalso(sobrescreve: Partial<ArquivoBackup> = {}): ArquivoBackup {
  return {
    versaoSchema: VERSAO_SCHEMA_BACKUP_ATUAL,
    exportadoEm: 1000,
    casa: { id: 'casa-teste', nome: 'Minha casa', criadaEm: 0, atualizadoEm: 0 },
    usuarios: [
      {
        id: 'usuario-teste',
        casaId: 'casa-teste',
        nome: 'Eu',
        perfil: 'admin',
        criadoEm: 0,
        atualizadoEm: 0,
      },
    ],
    produtos: [],
    movimentos: [],
    compras: [],
    itensCompra: [],
    ...sobrescreve,
  };
}

export class BackupRepositorioFalso implements BackupRepository {
  arquivo: ArquivoBackup = arquivoBackupFalso();
  chamadasMontar: { casaId: string; exportadoEm: number }[] = [];

  async montar(casaId: string, exportadoEm: number): Promise<ArquivoBackup> {
    this.chamadasMontar.push({ casaId, exportadoEm });
    return { ...this.arquivo, exportadoEm };
  }
}
