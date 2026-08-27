// Ponto de composição ÚNICO (design D5): os hooks importam daqui, tipado
// pelas interfaces de ports/. Trocar SQLite por outra fonte na Fase 2 é
// trocar estas linhas — nenhum caso de uso muda.
import { BackupRepository } from '../ports/backup.repository';
import { Clock } from '../ports/clock';
import { ConfiguracaoRepository } from '../ports/configuracao.repository';
import { CompraRepository } from '../ports/compra.repository';
import { MovimentoRepository } from '../ports/movimento.repository';
import { ProdutoRepository } from '../ports/produto.repository';
import { SistemaDeArquivos } from '../ports/sistema-de-arquivos';
import { db } from '../infrastructure/db/client';
import { garantirCasaEUsuario, IdentidadeLocal } from '../infrastructure/db/seed';
import { resetarBanco } from '../infrastructure/db/resetar-banco';
import { SQLiteBackupRepository } from '../infrastructure/repositories/sqlite-backup.repository';
import { SQLiteCompraRepository } from '../infrastructure/repositories/sqlite-compra.repository';
import { SQLiteConfiguracaoRepository } from '../infrastructure/repositories/sqlite-configuracao.repository';
import { SQLiteMovimentoRepository } from '../infrastructure/repositories/sqlite-movimento.repository';
import { SQLiteProdutoRepository } from '../infrastructure/repositories/sqlite-produto.repository';
import { ExpoSistemaDeArquivos } from '../infrastructure/sistema-de-arquivos/expo-sistema-de-arquivos';

export const relogio: Clock = { agora: () => Date.now() };

export const produtoRepository: ProdutoRepository = new SQLiteProdutoRepository(db, relogio);
export const movimentoRepository: MovimentoRepository = new SQLiteMovimentoRepository(db);
export const compraRepository: CompraRepository = new SQLiteCompraRepository(db);
export const configuracaoRepository: ConfiguracaoRepository =
  new SQLiteConfiguracaoRepository(db, relogio);
export const backupRepository: BackupRepository = new SQLiteBackupRepository(
  db,
  produtoRepository,
  movimentoRepository,
  compraRepository,
);
export const sistemaDeArquivos: SistemaDeArquivos = new ExpoSistemaDeArquivos();

let identidade: IdentidadeLocal | null = null;

/** Chamar só depois das migrations aplicadas. */
export function obterIdentidadeLocal(): IdentidadeLocal {
  if (!identidade) {
    identidade = garantirCasaEUsuario(db, relogio);
  }
  return identidade;
}

/**
 * Apaga todos os dados locais e recria casa/usuário na hora — o app
 * continua funcional sem reiniciar. Invalida o cache de identidade
 * acima, que senão apontaria pra uma casa/usuário que não existe mais.
 */
export function apagarTodosOsDados(): IdentidadeLocal {
  identidade = resetarBanco(db, relogio);
  return identidade;
}
