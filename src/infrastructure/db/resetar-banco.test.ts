import { garantirCasaEUsuario } from './seed';
import { resetarBanco } from './resetar-banco';
import { criarDbDeTeste } from './teste/criar-db-teste';
import { SQLiteProdutoRepository } from '../repositories/sqlite-produto.repository';
import { validarCadastroProduto } from '../../domain/produto/validacao';

const clock = { agora: () => 1_700_000_000_000 };

function popularDados(sqlite: import('better-sqlite3').Database, casaId: string, usuarioId: string) {
  sqlite
    .prepare(
      `INSERT INTO produto (id, casa_id, nome, unidade, quantidade_atual, quantidade_necessaria, criado_em, atualizado_em)
       VALUES ('produto-1', ?, 'Arroz', 'kg', 1000, 2000, 0, 0)`,
    )
    .run(casaId);
  sqlite
    .prepare(
      `INSERT INTO compra (id, casa_id, usuario_id, status, criada_em, atualizado_em)
       VALUES ('compra-1', ?, ?, 'aberta', 0, 0)`,
    )
    .run(casaId, usuarioId);
  // produto_id (caso comum: item de compra ligado a um produto real da
  // despensa, não avulso) — compra_item precisa ser apagado antes da casa
  // pra não violar ck_compra_item_origem quando o FK onDelete:'set null'
  // de produto_id disparar durante a cascata (resetarBanco já faz isso).
  sqlite
    .prepare(
      `INSERT INTO compra_item (id, compra_id, produto_id, unidade, quantidade_planejada)
       VALUES ('item-1', 'compra-1', 'produto-1', 'kg', 1000)`,
    )
    .run();
  sqlite
    .prepare(
      `INSERT INTO movimento_estoque (id, casa_id, produto_id, usuario_id, tipo, quantidade_delta, quantidade_resultante, criado_em)
       VALUES ('mov-1', ?, 'produto-1', ?, 'baixa', -500, 500, 0)`,
    )
    .run(casaId, usuarioId);
  sqlite
    .prepare(
      `INSERT INTO configuracao (casa_id, chave, valor, atualizado_em) VALUES (?, 'tema', 'escuro', 0)`,
    )
    .run(casaId);
}

function contagem(sqlite: import('better-sqlite3').Database, tabela: string): number {
  const linha = sqlite.prepare(`SELECT COUNT(*) AS n FROM ${tabela}`).get() as { n: number };
  return linha.n;
}

describe('resetarBanco', () => {
  it('apaga produto, compra, compra_item, movimento_estoque e configuracao, e recria casa/usuário utilizável', () => {
    const { db, sqlite } = criarDbDeTeste();
    const antiga = garantirCasaEUsuario(db, clock);
    popularDados(sqlite, antiga.casaId, antiga.usuarioId);

    const nova = resetarBanco(db, clock);

    expect(contagem(sqlite, 'produto')).toBe(0);
    expect(contagem(sqlite, 'compra')).toBe(0);
    expect(contagem(sqlite, 'compra_item')).toBe(0);
    expect(contagem(sqlite, 'movimento_estoque')).toBe(0);
    expect(contagem(sqlite, 'configuracao')).toBe(0);
    expect(contagem(sqlite, 'casa')).toBe(1);
    expect(contagem(sqlite, 'usuario')).toBe(1);
    expect(nova.casaId).not.toBe(antiga.casaId);
    expect(nova.usuarioId).not.toBe(antiga.usuarioId);
  });

  it('a identidade recriada é utilizável imediatamente, sem erro de FK', async () => {
    const { db, sqlite } = criarDbDeTeste();
    const antiga = garantirCasaEUsuario(db, clock);
    popularDados(sqlite, antiga.casaId, antiga.usuarioId);

    const { casaId, usuarioId } = resetarBanco(db, clock);
    const repo = new SQLiteProdutoRepository(db, clock);
    const validado = validarCadastroProduto({
      nome: 'Feijão',
      unidade: 'kg',
      quantidadeNecessaria: 1,
    });
    if (!validado.ok) {
      throw new Error('fixture inválida');
    }
    const resultado = await repo.criar(casaId, usuarioId, validado.valor);

    expect(resultado.ok).toBe(true);
    expect(contagem(sqlite, 'produto')).toBe(1);
  });

  it('falha no meio da transação não altera nada (rollback total)', () => {
    const { db, sqlite } = criarDbDeTeste();
    const antiga = garantirCasaEUsuario(db, clock);
    popularDados(sqlite, antiga.casaId, antiga.usuarioId);

    const clockQuebrado = {
      agora: () => {
        throw new Error('falha simulada no meio da transação');
      },
    };

    expect(() => resetarBanco(db, clockQuebrado)).toThrow('falha simulada no meio da transação');

    expect(contagem(sqlite, 'casa')).toBe(1);
    expect(contagem(sqlite, 'usuario')).toBe(1);
    expect(contagem(sqlite, 'produto')).toBe(1);
    expect(contagem(sqlite, 'compra')).toBe(1);
    expect(contagem(sqlite, 'compra_item')).toBe(1);
    expect(contagem(sqlite, 'movimento_estoque')).toBe(1);
    expect(contagem(sqlite, 'configuracao')).toBe(1);
    const casaAtual = sqlite.prepare('SELECT id FROM casa').get() as { id: string };
    expect(casaAtual.id).toBe(antiga.casaId);
  });

  // compra_item.produto_id é onDelete:'set null' (histórico de compra
  // sobrevive à remoção do produto) — mas resetarBanco apaga compra_item
  // EXPLICITAMENTE antes da casa, então o FK nunca chega a disparar
  // durante o reset, evitando a violação de ck_compra_item_origem (exige
  // produto_id OU nome_avulso) que ocorreria se a ordem da cascata do
  // SQLite zerasse produto_id antes de apagar a própria linha.
  it('apaga sem erro mesmo com item de compra ligado a um produto real (não avulso)', () => {
    const { db, sqlite } = criarDbDeTeste();
    const { casaId, usuarioId } = garantirCasaEUsuario(db, clock);
    sqlite
      .prepare(
        `INSERT INTO produto (id, casa_id, nome, unidade, quantidade_atual, quantidade_necessaria, criado_em, atualizado_em)
         VALUES ('produto-1', ?, 'Arroz', 'kg', 1000, 2000, 0, 0)`,
      )
      .run(casaId);
    sqlite
      .prepare(
        `INSERT INTO compra (id, casa_id, usuario_id, status, criada_em, atualizado_em)
         VALUES ('compra-1', ?, ?, 'aberta', 0, 0)`,
      )
      .run(casaId, usuarioId);
    sqlite
      .prepare(
        `INSERT INTO compra_item (id, compra_id, produto_id, unidade, quantidade_planejada)
         VALUES ('item-1', 'compra-1', 'produto-1', 'kg', 1000)`,
      )
      .run();

    expect(() => resetarBanco(db, clock)).not.toThrow();
    expect(contagem(sqlite, 'compra_item')).toBe(0);
  });
});
