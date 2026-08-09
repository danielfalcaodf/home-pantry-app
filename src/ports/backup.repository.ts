import { ArquivoBackup } from '../domain/backup/backup.schema';

export interface BackupRepository {
  /**
   * Reúne casa, usuários e todos os registros da casa (inclusive removidos
   * logicamente, sem truncar histórico) num único `ArquivoBackup`.
   */
  montar(casaId: string, exportadoEm: number): Promise<ArquivoBackup>;
  /**
   * Aplica o conteúdo do backup em UMA transação, combinando por
   * identificador (insere o ausente, atualiza o existente — design D2).
   * A `casa` do arquivo nunca é inserida: todo `casaId` do conteúdo é
   * reescrito para `casaIdLocal` (design D8) — a casa local, criada no
   * primeiro uso do aparelho, é sempre a que fica. O chamador já validou a
   * estrutura e a versão (domain `validarBackup`/`converterParaVersaoAtual`)
   * antes de chegar aqui; falha de escrita (violação de restrição, produto
   * referenciado ausente) derruba a transação inteira.
   */
  restaurar(arquivo: ArquivoBackup, casaIdLocal: string, aplicadoEm: number): Promise<void>;
}
