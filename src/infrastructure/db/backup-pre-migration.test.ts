import { File } from 'expo-file-system';

import { fazerBackupSeMigrationPendente } from './backup-pre-migration';

// `migrations/migrations` importa `.sql` via loader do Metro (não resolvível
// sob Jest puro) — mockado com o mesmo total de entradas do journal real (4).
jest.mock('./migrations/migrations', () => ({
  journal: { entries: [{ idx: 0 }, { idx: 1 }, { idx: 2 }, { idx: 3 }] },
}));

// `./client` importa `expo-sqlite`/`drizzle-orm/expo-sqlite` (ESM não
// transformável sob o projeto Jest `infra`, sem preset jest-expo) só para
// expor o nome do arquivo — mockado para evitar puxar essa cadeia inteira.
jest.mock('./client', () => ({ NOME_ARQUIVO_DB: 'estoque.db' }));

let mockOriginalExists = true;
let mockDestinosExistentes = new Set<string>();
let mockListResult: unknown[] = [];
const mockCopy = jest.fn();
const mockDelete = jest.fn();

jest.mock('expo-file-system', () => {
  class MockFile {
    name: string;
    constructor(_parent: unknown, name?: string) {
      this.name = name ?? String(_parent);
    }
    get exists() {
      return this.name === 'estoque.db' ? mockOriginalExists : mockDestinosExistentes.has(this.name);
    }
    copy(destino: unknown) {
      mockCopy(this.name, (destino as { name: string }).name);
    }
    delete() {
      mockDelete(this.name);
      mockDestinosExistentes.delete(this.name);
    }
  }
  class MockDirectory {
    list() {
      return mockListResult;
    }
  }
  return {
    File: MockFile,
    Directory: MockDirectory,
    Paths: { document: 'file:///document' },
  };
});

type SqliteFake = Parameters<typeof fazerBackupSeMigrationPendente>[0];

function sqliteFake(aplicadas: number): SqliteFake {
  return {
    getFirstSync: jest.fn((consulta: string) => {
      if (consulta.includes('sqlite_master')) {
        return aplicadas === 0 ? null : { name: '__drizzle_migrations' };
      }
      return { n: aplicadas };
    }),
  } as unknown as SqliteFake;
}

function arquivo(nome: string): File {
  return new File('', nome);
}

describe('fazerBackupSeMigrationPendente', () => {
  beforeEach(() => {
    mockOriginalExists = true;
    mockDestinosExistentes = new Set();
    mockListResult = [];
    mockCopy.mockClear();
    mockDelete.mockClear();
  });

  it('gera cópia do arquivo do banco quando há migration pendente', () => {
    fazerBackupSeMigrationPendente(sqliteFake(2));

    expect(mockCopy).toHaveBeenCalledWith('estoque.db', 'estoque.pre-v2.db');
  });

  it('mantém só as duas cópias mais recentes', () => {
    mockListResult = [
      arquivo('estoque.pre-v1.db'),
      arquivo('estoque.pre-v2.db'),
      arquivo('estoque.pre-v3.db'),
    ];

    fazerBackupSeMigrationPendente(sqliteFake(3));

    // Mantém as duas versões mais altas (3 e 2); apaga a mais antiga (1).
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith('estoque.pre-v1.db');
  });

  it('ignora entradas que não seguem o padrão de nome de cópia', () => {
    mockListResult = [
      arquivo('estoque.pre-v1.db'),
      arquivo('estoque.pre-v2.db'),
      arquivo('outro-arquivo.txt'),
    ];

    fazerBackupSeMigrationPendente(sqliteFake(2));

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('não gera cópia quando o banco é novo (nenhuma migration aplicada)', () => {
    fazerBackupSeMigrationPendente(sqliteFake(0));

    expect(mockCopy).not.toHaveBeenCalled();
  });

  it('não gera cópia quando o banco já está atualizado (todas migrations aplicadas)', () => {
    fazerBackupSeMigrationPendente(sqliteFake(4));

    expect(mockCopy).not.toHaveBeenCalled();
  });

  it('não gera cópia quando o arquivo original não existe', () => {
    mockOriginalExists = false;

    fazerBackupSeMigrationPendente(sqliteFake(2));

    expect(mockCopy).not.toHaveBeenCalled();
  });

  // Bug real: uma tentativa anterior interrompida antes de aplicar a
  // migration (crash, Fast Refresh em dev) deixa a cópia da mesma versão
  // para trás — `File.copy` lançaria "Destination already exists" e travaria
  // toda tentativa seguinte no mesmo erro, sem nunca chegar a aplicar a
  // migration.
  it('sobrescreve a cópia se já existir uma da mesma versão (retomada após interrupção)', () => {
    mockDestinosExistentes.add('estoque.pre-v2.db');

    fazerBackupSeMigrationPendente(sqliteFake(2));

    expect(mockDelete).toHaveBeenCalledWith('estoque.pre-v2.db');
    expect(mockCopy).toHaveBeenCalledWith('estoque.db', 'estoque.pre-v2.db');
  });
});
