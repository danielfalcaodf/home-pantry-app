import { Clock } from '../../ports/clock';
import { garantirCasaEUsuario, IdentidadeLocal } from './seed';
import { casa } from './schema';
import { Db } from './tipos';

// Apagar a casa cascateia produto/compra/compra_item/movimento_estoque/
// configuracao (todos com onDelete:'cascade' até casa) — apagar tabela por
// tabela seria redundante. garantirCasaEUsuario é idempotente e recria a
// casa/usuário local na mesma transação, para o app continuar funcional
// sem precisar reiniciar.
export function resetarBanco(db: Db, clock: Clock): IdentidadeLocal {
  return db.transaction((tx) => {
    tx.delete(casa).run();
    return garantirCasaEUsuario(tx, clock);
  });
}
