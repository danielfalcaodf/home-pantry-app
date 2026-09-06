import { Directory, File, Paths } from 'expo-file-system';

import { NOME_ARQUIVO_DB } from './client';
import migrations from './migrations/migrations';

type SqliteBruto = {
  getFirstSync<T>(consulta: string): T | null;
};

function contarMigrationsAplicadas(sqlite: SqliteBruto): number {
  const tabela = sqlite.getFirstSync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = '__drizzle_migrations'",
  );
  if (!tabela) {
    return 0;
  }
  const linha = sqlite.getFirstSync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM __drizzle_migrations',
  );
  return linha?.n ?? 0;
}

const COPIAS_MANTIDAS = 2;
const PADRAO_COPIA = /^estoque\.pre-v(\d+)\.db$/;

/**
 * Cópia de segurança do arquivo do banco ANTES de aplicar migration pendente
 * (DATABASE §9.2): migrations são forward-only e não há rollback no aparelho —
 * o backup é o único caminho de recuperação. Mantém as duas cópias mais recentes.
 */
export function fazerBackupSeMigrationPendente(sqlite: SqliteBruto): void {
  const total = migrations.journal.entries.length;
  const aplicadas = contarMigrationsAplicadas(sqlite);
  if (aplicadas === 0 || aplicadas >= total) {
    // banco novo (nada a preservar) ou já atualizado
    return;
  }

  const diretorio = new Directory(Paths.document, 'SQLite');
  const original = new File(diretorio, NOME_ARQUIVO_DB);
  if (!original.exists) {
    return;
  }
  const destino = new File(diretorio, `estoque.pre-v${aplicadas}.db`);
  // `File.copy` lança se o destino já existe — uma tentativa anterior
  // interrompida antes de aplicar a migration (crash, Fast Refresh em dev)
  // deixa essa cópia para trás e travaria toda tentativa seguinte no mesmo
  // erro. A cópia é do mesmo `aplicadas`, então sobrescrever é seguro.
  if (destino.exists) {
    destino.delete();
  }
  original.copy(destino);

  const copias = diretorio
    .list()
    .filter((entrada): entrada is File => entrada instanceof File && PADRAO_COPIA.test(entrada.name))
    .sort((a, b) => {
      const versaoA = Number(PADRAO_COPIA.exec(a.name)?.[1] ?? 0);
      const versaoB = Number(PADRAO_COPIA.exec(b.name)?.[1] ?? 0);
      return versaoB - versaoA;
    });
  for (const antiga of copias.slice(COPIAS_MANTIDAS)) {
    antiga.delete();
  }
}
