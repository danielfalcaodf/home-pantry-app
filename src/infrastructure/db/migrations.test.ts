import { criarDbDeTeste, semearCasaEUsuario } from './teste/criar-db-teste';

const TABELAS_ESPERADAS = [
  'casa',
  'compra',
  'compra_item',
  'configuracao', // 0001_configuracao
  'movimento_estoque',
  'produto',
  'usuario',
];

const INDICES_ESPERADOS = [
  'idx_compra_item_compra',
  'idx_movimento_casa_data',
  'idx_movimento_produto_data',
  'idx_produto_categoria',
  'idx_produto_em_falta',
  'ux_compra_aberta',
  'ux_produto_casa_nome',
];

describe('migrations aplicadas em sequência sobre banco vazio', () => {
  it('cria todas as tabelas declaradas', () => {
    const { sqlite } = criarDbDeTeste();
    const tabelas = sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all()
      .map((linha) => (linha as { name: string }).name);
    expect(tabelas).toEqual(TABELAS_ESPERADAS);
  });

  it('cria os sete índices do MVP e nenhum sobre sync_status', () => {
    const { sqlite } = criarDbDeTeste();
    const indices = sqlite
      .prepare(
        "SELECT name, sql FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all() as { name: string; sql: string }[];
    expect(indices.map((i) => i.name)).toEqual(INDICES_ESPERADOS);
    for (const indice of indices) {
      expect(indice.sql).not.toMatch(/sync_status/);
    }
  });

  it('índice de histórico por produto é decrescente por data', () => {
    const { sqlite } = criarDbDeTeste();
    const { sql } = sqlite
      .prepare("SELECT sql FROM sqlite_master WHERE name = 'idx_movimento_produto_data'")
      .get() as { sql: string };
    expect(sql).toMatch(/criado_em"? DESC/);
  });

  it('unicidade de nome é insensível a caixa e ignora removidos', () => {
    const { sql } = criarDbDeTeste().sqlite
      .prepare("SELECT sql FROM sqlite_master WHERE name = 'ux_produto_casa_nome'")
      .get() as { sql: string };
    expect(sql).toMatch(/COLLATE NOCASE/);
    expect(sql).toMatch(/deletado_em.* IS NULL/);
  });
});

describe('restrições rejeitam violação em runtime', () => {
  function inserirProduto(sqlite: ReturnType<typeof criarDbDeTeste>['sqlite'], sql: string) {
    return () => sqlite.prepare(sql).run();
  }

  it.each([
    [
      'nome vazio',
      `INSERT INTO produto (id, casa_id, nome, unidade, quantidade_necessaria, criado_em, atualizado_em)
       VALUES ('x', 'casa-teste', '   ', 'un', 1000, 0, 0)`,
    ],
    [
      'unidade fora do conjunto',
      `INSERT INTO produto (id, casa_id, nome, unidade, quantidade_necessaria, criado_em, atualizado_em)
       VALUES ('x', 'casa-teste', 'Arroz', 'tonelada', 1000, 0, 0)`,
    ],
    [
      'quantidade atual negativa',
      `INSERT INTO produto (id, casa_id, nome, unidade, quantidade_atual, quantidade_necessaria, criado_em, atualizado_em)
       VALUES ('x', 'casa-teste', 'Arroz', 'un', -1, 1000, 0, 0)`,
    ],
    [
      'quantidade necessária zero',
      `INSERT INTO produto (id, casa_id, nome, unidade, quantidade_necessaria, criado_em, atualizado_em)
       VALUES ('x', 'casa-teste', 'Arroz', 'un', 0, 0, 0)`,
    ],
    [
      'valor unitário negativo',
      `INSERT INTO produto (id, casa_id, nome, unidade, quantidade_necessaria, valor_unitario, criado_em, atualizado_em)
       VALUES ('x', 'casa-teste', 'Arroz', 'un', 1000, -1, 0, 0)`,
    ],
  ])('produto: %s', (_nome, sql) => {
    const { sqlite } = criarDbDeTeste();
    semearCasaEUsuario(sqlite);
    expect(inserirProduto(sqlite, sql)).toThrow(/CHECK/i);
  });

  function comProduto(): ReturnType<typeof criarDbDeTeste>['sqlite'] {
    const { sqlite } = criarDbDeTeste();
    semearCasaEUsuario(sqlite);
    sqlite
      .prepare(
        `INSERT INTO produto (id, casa_id, nome, unidade, quantidade_atual, quantidade_necessaria, criado_em, atualizado_em)
         VALUES ('p1', 'casa-teste', 'Arroz', 'un', 2000, 3000, 0, 0)`,
      )
      .run();
    return sqlite;
  }

  it.each([
    [
      'variação zero',
      `INSERT INTO movimento_estoque (id, casa_id, produto_id, usuario_id, tipo, quantidade_delta, quantidade_resultante, criado_em)
       VALUES ('m1', 'casa-teste', 'p1', 'usuario-teste', 'ajuste', 0, 2000, 0)`,
    ],
    [
      'baixa com sinal positivo',
      `INSERT INTO movimento_estoque (id, casa_id, produto_id, usuario_id, tipo, quantidade_delta, quantidade_resultante, criado_em)
       VALUES ('m1', 'casa-teste', 'p1', 'usuario-teste', 'baixa', 1000, 3000, 0)`,
    ],
    [
      'reposição com sinal negativo',
      `INSERT INTO movimento_estoque (id, casa_id, produto_id, usuario_id, tipo, quantidade_delta, quantidade_resultante, criado_em)
       VALUES ('m1', 'casa-teste', 'p1', 'usuario-teste', 'reposicao', -1000, 1000, 0)`,
    ],
    [
      'saldo resultante negativo',
      `INSERT INTO movimento_estoque (id, casa_id, produto_id, usuario_id, tipo, quantidade_delta, quantidade_resultante, criado_em)
       VALUES ('m1', 'casa-teste', 'p1', 'usuario-teste', 'baixa', -1000, -1, 0)`,
    ],
  ])('movimento: %s', (_nome, sql) => {
    const sqlite = comProduto();
    expect(() => sqlite.prepare(sql).run()).toThrow(/CHECK/i);
  });

  it('compra finalizada sem data é rejeitada', () => {
    const { sqlite } = criarDbDeTeste();
    semearCasaEUsuario(sqlite);
    expect(() =>
      sqlite
        .prepare(
          `INSERT INTO compra (id, casa_id, usuario_id, status, criada_em, atualizado_em)
           VALUES ('c1', 'casa-teste', 'usuario-teste', 'finalizada', 0, 0)`,
        )
        .run(),
    ).toThrow(/CHECK/i);
  });

  it('segunda compra aberta na mesma casa é rejeitada pelo índice único', () => {
    const { sqlite } = criarDbDeTeste();
    semearCasaEUsuario(sqlite);
    const inserir = (id: string) =>
      sqlite
        .prepare(
          `INSERT INTO compra (id, casa_id, usuario_id, status, criada_em, atualizado_em)
           VALUES (?, 'casa-teste', 'usuario-teste', 'aberta', 0, 0)`,
        )
        .run(id);
    inserir('c1');
    expect(() => inserir('c2')).toThrow(/UNIQUE/i);
  });

  it('item de compra sem produto e sem nome avulso é rejeitado', () => {
    const { sqlite } = criarDbDeTeste();
    semearCasaEUsuario(sqlite);
    sqlite
      .prepare(
        `INSERT INTO compra (id, casa_id, usuario_id, status, criada_em, atualizado_em)
         VALUES ('c1', 'casa-teste', 'usuario-teste', 'aberta', 0, 0)`,
      )
      .run();
    expect(() =>
      sqlite
        .prepare(
          `INSERT INTO compra_item (id, compra_id, unidade, quantidade_planejada)
           VALUES ('i1', 'c1', 'un', 1000)`,
        )
        .run(),
    ).toThrow(/CHECK/i);
  });

  it('item marcado como comprado sem quantidade é rejeitado', () => {
    const { sqlite } = criarDbDeTeste();
    semearCasaEUsuario(sqlite);
    sqlite
      .prepare(
        `INSERT INTO compra (id, casa_id, usuario_id, status, criada_em, atualizado_em)
         VALUES ('c1', 'casa-teste', 'usuario-teste', 'aberta', 0, 0)`,
      )
      .run();
    expect(() =>
      sqlite
        .prepare(
          `INSERT INTO compra_item (id, compra_id, nome_avulso, unidade, quantidade_planejada, comprado)
           VALUES ('i1', 'c1', 'Pilha', 'un', 1000, 1)`,
        )
        .run(),
    ).toThrow(/CHECK/i);
  });

  it('resposta de atualizar preço fora de 0/1 é rejeitada', () => {
    const { sqlite } = criarDbDeTeste();
    semearCasaEUsuario(sqlite);
    sqlite
      .prepare(
        `INSERT INTO compra (id, casa_id, usuario_id, status, criada_em, atualizado_em)
         VALUES ('c1', 'casa-teste', 'usuario-teste', 'aberta', 0, 0)`,
      )
      .run();
    expect(() =>
      sqlite
        .prepare(
          `INSERT INTO compra_item (id, compra_id, nome_avulso, unidade, quantidade_planejada, atualizar_preco)
           VALUES ('i1', 'c1', 'Pilha', 'un', 1000, 2)`,
        )
        .run(),
    ).toThrow(/CHECK/i);
  });

  it('perfil de usuário fora de admin/membro é rejeitado', () => {
    const { sqlite } = criarDbDeTeste();
    semearCasaEUsuario(sqlite);
    expect(() =>
      sqlite
        .prepare(
          `INSERT INTO usuario (id, casa_id, nome, perfil, criado_em, atualizado_em)
           VALUES ('u2', 'casa-teste', 'Outro', 'dono', 0, 0)`,
        )
        .run(),
    ).toThrow(/CHECK/i);
  });
});

describe('índice parcial de faltantes', () => {
  it('a consulta de faltantes usa idx_produto_em_falta, não varredura completa', () => {
    const { sqlite } = criarDbDeTeste();
    semearCasaEUsuario(sqlite);
    // Volume realista + ANALYZE: em tabela vazia o planejador escolhe outro
    // índice por chute de custo; com estatísticas o parcial vence.
    const inserir = sqlite.prepare(
      `INSERT INTO produto (id, casa_id, nome, categoria, unidade, quantidade_atual, quantidade_necessaria, criado_em, atualizado_em)
       VALUES (?, 'casa-teste', ?, ?, 'un', ?, 1000, 0, 0)`,
    );
    for (let i = 0; i < 300; i++) {
      inserir.run(`p${i}`, `Produto ${i}`, `Categoria ${i % 8}`, i % 10 === 0 ? 0 : 2000);
    }
    sqlite.exec('ANALYZE');
    const plano = sqlite
      .prepare(
        `EXPLAIN QUERY PLAN
         SELECT id, nome FROM produto
         WHERE casa_id = ? AND ativo = 1 AND deletado_em IS NULL
           AND quantidade_atual < quantidade_necessaria
         ORDER BY categoria COLLATE NOCASE, nome COLLATE NOCASE`,
      )
      .all('casa-teste') as { detail: string }[];
    const detalhes = plano.map((linha) => linha.detail).join(' | ');
    expect(detalhes).toMatch(/idx_produto_em_falta/);
    expect(detalhes).not.toMatch(/SCAN produto/);
  });
});
