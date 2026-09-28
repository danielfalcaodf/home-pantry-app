import Database from 'better-sqlite3';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Migration 0005_reducao-unidades-un-kg (change correcao-unidades-un-kg-preco):
// aplica 0000-0004, grava dados nas 7 unidades antigas e só então aplica a
// 0005 — o cenário real de um aparelho que atualiza o app.
const DIR = path.join(__dirname, 'migrations');
const ARQUIVOS = fs
  .readdirSync(DIR)
  .filter((nome) => nome.endsWith('.sql'))
  .sort();
const REDUCAO = '0005_reducao-unidades-un-kg.sql';
const ANTES = ARQUIVOS.slice(0, ARQUIVOS.indexOf(REDUCAO));

function aplicar(sqlite: Database.Database, arquivos: string[]): void {
  for (const arquivo of arquivos) {
    const sql = fs.readFileSync(path.join(DIR, arquivo), 'utf8');
    for (const trecho of sql.split('--> statement-breakpoint')) {
      sqlite.exec(trecho);
    }
  }
}

function bancoNaVersao0004(): Database.Database {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  aplicar(sqlite, ANTES);
  sqlite.exec(`
    INSERT INTO casa (id, nome, criada_em, atualizado_em) VALUES ('c', 'Casa', 0, 0);
    INSERT INTO usuario (id, casa_id, nome, perfil, criado_em, atualizado_em)
      VALUES ('u', 'c', 'Eu', 'admin', 0, 0);
  `);
  return sqlite;
}

function inserirProduto(
  sqlite: Database.Database,
  id: string,
  unidade: string,
  atual: number,
  necessaria: number,
  valor: number,
  fator: number | null = null,
  valorPacote: number | null = null,
): void {
  sqlite
    .prepare(
      `INSERT INTO produto (id, casa_id, nome, unidade, quantidade_atual, quantidade_necessaria,
         valor_unitario, fator_conversao_embalagem, valor_referencia_embalagem, criado_em, atualizado_em)
       VALUES (?, 'c', ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    )
    .run(id, `Produto ${id}`, unidade, atual, necessaria, valor, fator, valorPacote);
}

function inserirMovimento(
  sqlite: Database.Database,
  id: string,
  produtoId: string,
  tipo: 'baixa' | 'reposicao' | 'ajuste',
  delta: number,
  resultante: number,
): void {
  sqlite
    .prepare(
      `INSERT INTO movimento_estoque (id, casa_id, produto_id, usuario_id, tipo, quantidade_delta,
         quantidade_resultante, criado_em)
       VALUES (?, 'c', ?, 'u', ?, ?, ?, 0)`,
    )
    .run(id, produtoId, tipo, delta, resultante);
}

type Linha = Record<string, unknown>;
const produto = (sqlite: Database.Database, id: string) =>
  sqlite.prepare('SELECT * FROM produto WHERE id = ?').get(id) as Linha;
const movimento = (sqlite: Database.Database, id: string) =>
  sqlite.prepare('SELECT * FROM movimento_estoque WHERE id = ?').get(id) as Linha;
const item = (sqlite: Database.Database, id: string) =>
  sqlite.prepare('SELECT * FROM compra_item WHERE id = ?').get(id) as Linha;

describe('migration 0005 — prova do bug de preço em gramas', () => {
  it('produto g vira kg sem preço, com histórico na mesma escala', () => {
    const sqlite = bancoNaVersao0004();
    inserirProduto(sqlite, 'queijo', 'g', 700000, 1000000, 519);
    inserirMovimento(sqlite, 'm1', 'queijo', 'reposicao', 700000, 700000);
    inserirMovimento(sqlite, 'm2', 'queijo', 'baixa', -200000, 500000);
    sqlite.prepare('UPDATE produto SET quantidade_atual = 500000 WHERE id = ?').run('queijo');

    aplicar(sqlite, [REDUCAO]);

    expect(produto(sqlite, 'queijo')).toEqual(
      expect.objectContaining({
        unidade: 'kg',
        quantidade_atual: 500,
        quantidade_necessaria: 1000,
        valor_unitario: 0,
      }),
    );
    expect(movimento(sqlite, 'm2')).toEqual(
      expect.objectContaining({ quantidade_delta: -200, quantidade_resultante: 500 }),
    );
    const { soma } = sqlite
      .prepare('SELECT SUM(quantidade_delta) AS soma FROM movimento_estoque WHERE produto_id = ?')
      .get('queijo') as { soma: number };
    expect(soma).toBe(500);
  });
});

describe('migration 0005 — casos de borda', () => {
  it('pacote com fator e caixa viram un com números, preço e fator intactos', () => {
    const sqlite = bancoNaVersao0004();
    inserirProduto(sqlite, 'papel', 'pacote', 3000, 2000, 1290, 12, 1290);
    inserirProduto(sqlite, 'sabao', 'caixa', 1000, 2000, 2490);

    aplicar(sqlite, [REDUCAO]);

    expect(produto(sqlite, 'papel')).toEqual(
      expect.objectContaining({
        unidade: 'un',
        quantidade_atual: 3000,
        quantidade_necessaria: 2000,
        valor_unitario: 1290,
        fator_conversao_embalagem: 12,
        valor_referencia_embalagem: 1290,
      }),
    );
    expect(produto(sqlite, 'sabao')).toEqual(
      expect.objectContaining({ unidade: 'un', quantidade_atual: 1000, valor_unitario: 2490 }),
    );
  });

  it.each(['L', 'ml'])('%s vira un arredondado para cima e sem preço', (unidade) => {
    const sqlite = bancoNaVersao0004();
    inserirProduto(sqlite, 'leite', unidade, 1500, 2500, 899);

    aplicar(sqlite, [REDUCAO]);

    expect(produto(sqlite, 'leite')).toEqual(
      expect.objectContaining({
        unidade: 'un',
        quantidade_atual: 2000,
        quantidade_necessaria: 3000,
        valor_unitario: 0,
      }),
    );
  });

  it('item de compra em g: estimado zerado na aberta, valor pago mantido na fechada', () => {
    const sqlite = bancoNaVersao0004();
    inserirProduto(sqlite, 'queijo', 'g', 0, 500000, 519);
    sqlite.exec(`
      INSERT INTO compra (id, casa_id, usuario_id, status, criada_em, finalizada_em, atualizado_em)
        VALUES ('fechada', 'c', 'u', 'finalizada', 0, 1, 0);
      INSERT INTO compra (id, casa_id, usuario_id, status, criada_em, atualizado_em)
        VALUES ('aberta', 'c', 'u', 'aberta', 0, 0);
      INSERT INTO compra_item (id, compra_id, produto_id, unidade, quantidade_planejada,
          quantidade_comprada, valor_estimado_unit, valor_pago_unitario, comprado)
        VALUES ('i-fechada', 'fechada', 'queijo', 'g', 500000, 400000, 519, 520, 1);
      INSERT INTO compra_item (id, compra_id, produto_id, unidade, quantidade_planejada,
          valor_estimado_unit)
        VALUES ('i-aberta', 'aberta', 'queijo', 'g', 500000, 519);
    `);

    aplicar(sqlite, [REDUCAO]);

    expect(item(sqlite, 'i-fechada')).toEqual(
      expect.objectContaining({
        unidade: 'kg',
        quantidade_planejada: 500,
        quantidade_comprada: 400,
        valor_estimado_unit: 519,
        valor_pago_unitario: 520,
      }),
    );
    expect(item(sqlite, 'i-aberta')).toEqual(
      expect.objectContaining({
        unidade: 'kg',
        quantidade_planejada: 500,
        quantidade_comprada: null,
        valor_estimado_unit: 0,
      }),
    );
  });

  it('itens de compra em pacote/caixa/L viram un', () => {
    const sqlite = bancoNaVersao0004();
    sqlite.exec(`
      INSERT INTO compra (id, casa_id, usuario_id, status, criada_em, atualizado_em)
        VALUES ('aberta', 'c', 'u', 'aberta', 0, 0);
      INSERT INTO compra_item (id, compra_id, nome_avulso, unidade, quantidade_planejada)
        VALUES ('i-pacote', 'aberta', 'Pilha', 'pacote', 2000),
               ('i-litro', 'aberta', 'Suco', 'L', 1500);
    `);

    aplicar(sqlite, [REDUCAO]);

    expect(item(sqlite, 'i-pacote')).toEqual(
      expect.objectContaining({ unidade: 'un', quantidade_planejada: 2000 }),
    );
    expect(item(sqlite, 'i-litro')).toEqual(
      expect.objectContaining({ unidade: 'un', quantidade_planejada: 2000 }),
    );
  });

  it('fração de grama não zera a variação nem aborta a migration', () => {
    const sqlite = bancoNaVersao0004();
    inserirProduto(sqlite, 'acafrao', 'g', 1000, 5000, 0);
    inserirMovimento(sqlite, 'm-fracao', 'acafrao', 'baixa', -400, 1000);
    inserirMovimento(sqlite, 'm-meio', 'acafrao', 'ajuste', 1500, 1000);

    expect(() => aplicar(sqlite, [REDUCAO])).not.toThrow();

    expect(movimento(sqlite, 'm-fracao')).toEqual(
      expect.objectContaining({ quantidade_delta: -1, quantidade_resultante: 1 }),
    );
    // Metade arredonda para longe do zero, igual a gramasParaKg no TS.
    expect(movimento(sqlite, 'm-meio')).toEqual(expect.objectContaining({ quantidade_delta: 2 }));
  });

  it('nenhum movimento é apagado e nenhum item perde o produto (sem DROP de produto)', () => {
    const sqlite = bancoNaVersao0004();
    inserirProduto(sqlite, 'queijo', 'g', 500000, 1000000, 519);
    inserirProduto(sqlite, 'arroz', 'pacote', 2000, 2000, 2290);
    inserirMovimento(sqlite, 'm1', 'queijo', 'reposicao', 500000, 500000);
    inserirMovimento(sqlite, 'm2', 'arroz', 'reposicao', 2000, 2000);
    sqlite.exec(`
      INSERT INTO compra (id, casa_id, usuario_id, status, criada_em, atualizado_em)
        VALUES ('aberta', 'c', 'u', 'aberta', 0, 0);
      INSERT INTO compra_item (id, compra_id, produto_id, unidade, quantidade_planejada)
        VALUES ('i1', 'aberta', 'queijo', 'g', 500000), ('i2', 'aberta', 'arroz', 'pacote', 1000);
    `);
    const contar = (sql: string) => (sqlite.prepare(sql).get() as { n: number }).n;
    const movimentosAntes = contar('SELECT COUNT(*) AS n FROM movimento_estoque');

    aplicar(sqlite, [REDUCAO]);

    expect(contar('SELECT COUNT(*) AS n FROM movimento_estoque')).toBe(movimentosAntes);
    expect(contar('SELECT COUNT(*) AS n FROM compra_item WHERE produto_id IS NULL')).toBe(0);
  });

  it('depois da 0005, INSERT e UPDATE com unidade removida falham; un/kg passam', () => {
    const sqlite = bancoNaVersao0004();
    aplicar(sqlite, [REDUCAO]);

    for (const unidade of ['g', 'ml', 'L', 'pacote', 'caixa']) {
      expect(() => inserirProduto(sqlite, `x-${unidade}`, unidade, 0, 1000, 0)).toThrow(
        /ck_produto_unidade/,
      );
    }
    inserirProduto(sqlite, 'ok-un', 'un', 0, 1000, 0);
    inserirProduto(sqlite, 'ok-kg', 'kg', 0, 1000, 0);
    expect(() =>
      sqlite.prepare("UPDATE produto SET unidade = 'g' WHERE id = 'ok-un'").run(),
    ).toThrow(/ck_produto_unidade/);
    sqlite.prepare("UPDATE produto SET unidade = 'kg' WHERE id = 'ok-un'").run();
    expect(produto(sqlite, 'ok-un')).toEqual(expect.objectContaining({ unidade: 'kg' }));
  });
});
