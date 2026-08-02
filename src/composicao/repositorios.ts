// Ponto de composição ÚNICO (design D5): os hooks importam daqui, tipado
// pelas interfaces de ports/. Trocar SQLite por outra fonte na Fase 2 é
// trocar estas linhas — nenhum caso de uso muda.
import { Clock } from '../ports/clock';
import { CompraRepository } from '../ports/compra.repository';
import { MovimentoRepository } from '../ports/movimento.repository';
import { ProdutoRepository } from '../ports/produto.repository';
import { db } from '../infrastructure/db/client';
import { garantirCasaEUsuario, IdentidadeLocal } from '../infrastructure/db/seed';
import { SQLiteCompraRepository } from '../infrastructure/repositories/sqlite-compra.repository';
import { SQLiteMovimentoRepository } from '../infrastructure/repositories/sqlite-movimento.repository';
import { SQLiteProdutoRepository } from '../infrastructure/repositories/sqlite-produto.repository';

export const relogio: Clock = { agora: () => Date.now() };

export const produtoRepository: ProdutoRepository = new SQLiteProdutoRepository(db, relogio);
export const movimentoRepository: MovimentoRepository = new SQLiteMovimentoRepository(db);
export const compraRepository: CompraRepository = new SQLiteCompraRepository(db);

let identidade: IdentidadeLocal | null = null;

/** Chamar só depois das migrations aplicadas. */
export function obterIdentidadeLocal(): IdentidadeLocal {
  if (!identidade) {
    identidade = garantirCasaEUsuario(db, relogio);
  }
  return identidade;
}
