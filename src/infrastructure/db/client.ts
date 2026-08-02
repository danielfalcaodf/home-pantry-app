import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const NOME_ARQUIVO_DB = 'estoque.db';

// UMA instância para todo o app — módulo singleton (DATABASE §8).
// enableChangeListener é o que faz o useLiveQuery re-renderizar após escrita.
const sqlite = openDatabaseSync(NOME_ARQUIVO_DB, { enableChangeListener: true });

// PRAGMAs por conexão, ANTES de qualquer query. FK vem DESLIGADA por padrão
// no SQLite — sem isso, os REFERENCES do schema são decoração.
sqlite.execSync(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 5000;
`);

// Autoverificação no binding do Expo: se o PRAGMA não pegou, falhar alto na
// abertura é melhor que acumular órfãos em silêncio.
const fk = sqlite.getFirstSync<{ foreign_keys: number }>('PRAGMA foreign_keys');
if (fk?.foreign_keys !== 1) {
  throw new Error('PRAGMA foreign_keys não está ligado — abortando abertura do banco');
}

export const db = drizzle(sqlite, { schema });
