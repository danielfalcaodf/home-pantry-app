import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as fs from 'node:fs';
import * as path from 'node:path';

import * as schema from '../schema';
import { Db } from '../tipos';

// Mesmo SQL das migrations, aplicado em sequência sobre um banco vazio —
// o schema testado é o schema real, não uma cópia.
export function aplicarMigrations(sqlite: Database.Database): void {
  const dir = path.join(__dirname, '..', 'migrations');
  const arquivos = fs
    .readdirSync(dir)
    .filter((nome) => nome.endsWith('.sql'))
    .sort();
  for (const arquivo of arquivos) {
    const sql = fs.readFileSync(path.join(dir, arquivo), 'utf8');
    for (const trecho of sql.split('--> statement-breakpoint')) {
      sqlite.exec(trecho);
    }
  }
}

export type DbDeTeste = { db: Db; sqlite: Database.Database };

export function criarDbDeTeste(): DbDeTeste {
  const sqlite = new Database(':memory:');
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('busy_timeout = 5000');
  aplicarMigrations(sqlite);
  const db = drizzle(sqlite, { schema }) as unknown as Db;
  return { db, sqlite };
}

// Fixture mínima: uma casa e um usuário para satisfazer as FKs.
export function semearCasaEUsuario(sqlite: Database.Database): {
  casaId: string;
  usuarioId: string;
} {
  const casaId = 'casa-teste';
  const usuarioId = 'usuario-teste';
  sqlite
    .prepare('INSERT INTO casa (id, nome, criada_em, atualizado_em) VALUES (?, ?, 0, 0)')
    .run(casaId, 'Casa de teste');
  sqlite
    .prepare(
      "INSERT INTO usuario (id, casa_id, nome, perfil, criado_em, atualizado_em) VALUES (?, ?, 'Eu', 'admin', 0, 0)",
    )
    .run(usuarioId, casaId);
  return { casaId, usuarioId };
}
