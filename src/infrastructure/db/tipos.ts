import { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import * as schema from './schema';

// Tipo comum aos dois drivers síncronos (expo-sqlite no app,
// better-sqlite3 nos testes) — os repositórios dependem só dele.
export type Db = BaseSQLiteDatabase<'sync', unknown, typeof schema>;
