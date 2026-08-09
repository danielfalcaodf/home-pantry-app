import { criarDbDeTeste, semearCasaEUsuario } from './teste/criar-db-teste';

describe('conexão — PRAGMAs', () => {
  it('foreign_keys está ligado (SQLite vem com FK desligada por padrão)', () => {
    const { sqlite } = criarDbDeTeste();
    expect(sqlite.pragma('foreign_keys', { simple: true })).toBe(1);
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
