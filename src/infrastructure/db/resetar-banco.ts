import { Clock } from '../../ports/clock';
import { garantirCasaEUsuario, IdentidadeLocal } from './seed';
import { casa, compraItem } from './schema';
import { Db } from './tipos';

// compra_item precisa ser apagado ANTES da casa: o FK onDelete:'set null' de
// produto_id dispara durante a cascata do DELETE em casa, e a constraint
// ck_compra_item_origem exige produto_id OU nome_avulso preenchido — um item
// comum (ligado a produto do estoque, sem nome_avulso) viola essa constraint
// no instante em que o SQLite zera produto_id, antes de a própria linha ser
// apagada pela cascata via compra_id. Apagar compra_item primeiro evita a
// ordem inválida. O restante (produto/compra/movimento_estoque/configuracao)
// cascateia normalmente ao apagar a casa. garantirCasaEUsuario é idempotente
// e recria casa/usuário na mesma transação, para o app continuar funcional
// sem precisar reiniciar.
export function resetarBanco(db: Db, clock: Clock): IdentidadeLocal {
  return db.transaction((tx) => {
    tx.delete(compraItem).run();
    tx.delete(casa).run();
    return garantirCasaEUsuario(tx, clock);
  });
}
