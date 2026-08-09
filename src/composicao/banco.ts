import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import { fazerBackupSeMigrationPendente } from '../infrastructure/db/backup-pre-migration';
import { db, sqliteBruto } from '../infrastructure/db/client';
import migrations from '../infrastructure/db/migrations/migrations';

export type EstadoDoBanco = {
  pronto: boolean;
  erro: Error | undefined;
};

// Cópia de segurança ANTES de qualquer migration (DATABASE §9.2). Roda no
// carregamento do módulo, uma vez por abertura, antes do hook rodar.
fazerBackupSeMigrationPendente(sqliteBruto);

/**
 * Único acesso do app ao ciclo de preparação do banco. A camada de rota não
 * conhece Drizzle, SQLite nem o arquivo de migrations — só este estado.
 */
export function usePrepararBanco(): EstadoDoBanco {
  const { success, error } = useMigrations(db, migrations);
  return { pronto: success, erro: error };
}
