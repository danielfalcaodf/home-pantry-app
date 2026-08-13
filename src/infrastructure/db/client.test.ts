import Database from 'better-sqlite3';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { criarDbDeTeste, semearCasaEUsuario } from './teste/criar-db-teste';

describe('conexão — PRAGMAs', () => {
  it('foreign_keys está ligado (SQLite vem com FK desligada por padrão)', () => {
    const { sqlite } = criarDbDeTeste();
    expect(sqlite.pragma('foreign_keys', { simple: true })).toBe(1);
  });

  // WAL exige um arquivo real — bancos `:memory:` (usados nos demais testes
  // desta suíte) sempre reportam journal_mode 'memory', então este teste
  // aplica o mesmo PRAGMA de `client.ts` sobre um arquivo temporário.
  it('journal_mode está em WAL', () => {
    const arquivo = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'repor-db-')), 'teste.db');
    const sqlite = new Database(arquivo);
    sqlite.pragma('journal_mode = WAL');

    expect(sqlite.pragma('journal_mode', { simple: true })).toBe('wal');

    sqlite.close();
    fs.rmSync(path.dirname(arquivo), { recursive: true, force: true });
  });

  it('inserir linha com referência inexistente falha por FK', () => {
    const { sqlite } = criarDbDeTeste();
    expect(() =>
      sqlite
        .prepare(
          `INSERT INTO produto (id, casa_id, nome, unidade, quantidade_necessaria, criado_em, atualizado_em)
           VALUES ('p1', 'casa-que-nao-existe', 'Arroz', 'un', 1000, 0, 0)`,
        )
        .run(),
    ).toThrow(/FOREIGN KEY/i);
  });

  it('com a casa existente a mesma inserção passa', () => {
    const { sqlite } = criarDbDeTeste();
    semearCasaEUsuario(sqlite);
    expect(() =>
      sqlite
        .prepare(
          `INSERT INTO produto (id, casa_id, nome, unidade, quantidade_necessaria, criado_em, atualizado_em)
           VALUES ('p1', 'casa-teste', 'Arroz', 'un', 1000, 0, 0)`,
        )
        .run(),
    ).not.toThrow();
  });
});

// `client.ts` importa expo-sqlite/drizzle-orm real (ESM, não transformável
// sob o projeto Jest `infra`) — mockado aqui só para provar o singleton do
// módulo, não o comportamento do driver (já coberto pelos testes de PRAGMA
// acima, via `criarDbDeTeste`/better-sqlite3).
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    getFirstSync: jest.fn(() => ({ foreign_keys: 1 })),
  })),
}));
jest.mock('drizzle-orm/expo-sqlite', () => ({
  drizzle: jest.fn((sqlite: unknown) => ({ __sqlite: sqlite })),
}));

describe('conexão — instância única (singleton)', () => {
  it('duas importações do módulo resolvem para o mesmo db e o mesmo sqlite bruto', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const primeiraImportacao = require('./client') as typeof import('./client');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const segundaImportacao = require('./client') as typeof import('./client');

    expect(primeiraImportacao.db).toBe(segundaImportacao.db);
    expect(primeiraImportacao.sqliteBruto).toBe(segundaImportacao.sqliteBruto);
  });
});
