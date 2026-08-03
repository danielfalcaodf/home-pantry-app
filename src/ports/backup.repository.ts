import { ArquivoBackup } from '../domain/backup/backup.schema';

export interface BackupRepository {
  /**
   * Reúne casa, usuários e todos os registros da casa (inclusive removidos
   * logicamente, sem truncar histórico) num único `ArquivoBackup`.
   */
  montar(casaId: string, exportadoEm: number): Promise<ArquivoBackup>;
}
