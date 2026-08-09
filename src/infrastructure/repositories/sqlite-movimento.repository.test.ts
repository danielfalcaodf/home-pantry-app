import { validarCadastroProduto } from '../../domain/produto/validacao';
import { milesimos } from '../../domain/shared/quantidade';
import { criarDbDeTeste, semearCasaEUsuario } from '../db/teste/criar-db-teste';
import { SQLiteMovimentoRepository } from './sqlite-movimento.repository';
import { SQLiteProdutoRepository } from './sqlite-produto.repository';

const clock = { agora: () => 1_700_000_000_000 };

async function montarComBaixa() {
  const { db, sqlite } = criarDbDeTeste();
  const { casaId, usuarioId } = semearCasaEUsuario(sqlite);
  const produtos = new SQLiteProdutoRepository(db, clock);
  const movimentos = new SQLiteMovimentoRepository(db);
  const dados = validarCadastroProduto({
    nome: 'Arroz',
    unidade: 'pacote',
    quantidadeNecessaria: 3,
    quantidadeAtual: 3,
  });
  if (!dados.ok) {
    throw new Error('setup');
  }
  const criado = await produtos.criar(casaId, usuarioId, dados.valor);
  if (!criado.ok) {
    throw new Error('setup');
  }
  const baixa = await produtos.darBaixa({
    produtoId: criado.valor.id,
    quantidade: milesimos(1000),
    usuarioId,
    criadoEm: clock.agora(),
  });
  if (!baixa.ok || !baixa.valor.gravou) {
    throw new Error('setup');
  }
  return {
    sqlite,
    casaId,
    usuarioId,
    movimentos,
    produtoId: criado.valor.id,
    movimentoId: baixa.valor.movimentoId,
  };
}

describe('históricos', () => {
  it('histórico por produto vem do mais recente para o mais antigo', async () => {
    const { movimentos, produtoId, sqlite, casaId, usuarioId } = await montarComBaixa();
    sqlite
      .prepare(
        `INSERT INTO movimento_estoque (id, casa_id, produto_id, usuario_id, tipo, quantidade_delta, quantidade_resultante, criado_em)
         VALUES ('m-antigo', ?, ?, ?, 'reposicao', 1000, 3000, 1)`,
      )
      .run(casaId, produtoId, usuarioId);
    const historico = await movimentos.historicoPorProduto(produtoId);
    expect(historico).toHaveLength(3); // ajuste inicial + baixa + m-antigo
    expect(historico[historico.length - 1].id).toBe('m-antigo');
    expect(historico[0].criadoEm).toBeGreaterThan(historico[2].criadoEm);
  });

  it('histórico por casa também é decrescente', async () => {
    const { movimentos, casaId } = await montarComBaixa();
    const historico = await movimentos.historicoPorCasa(casaId);
    expect(historico.map((m) => m.tipo).sort()).toEqual(['ajuste', 'baixa']);
  });
});

describe('desfazer', () => {
  it('mantém o original e insere o inverso, restaurando a quantidade', async () => {
    const { movimentos, movimentoId, produtoId, sqlite } = await montarComBaixa();
    const resultado = await movimentos.desfazer(movimentoId, clock.agora() + 1000);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor.saldoResultante).toBe(3000);
    }
    const linhas = sqlite
      .prepare(
        "SELECT id, tipo, quantidade_delta FROM movimento_estoque WHERE motivo IS NULL OR motivo <> 'estoque_inicial' ORDER BY criado_em",
      )
      .all() as { id: string; tipo: string; quantidade_delta: number }[];
    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toEqual(
      expect.objectContaining({ id: movimentoId, tipo: 'baixa', quantidade_delta: -1000 }),
    );
    expect(linhas[1]).toEqual(
      expect.objectContaining({ tipo: 'reposicao', quantidade_delta: 1000 }),
    );
    const produto = sqlite
      .prepare('SELECT quantidade_atual FROM produto WHERE id = ?')
      .get(produtoId) as { quantidade_atual: number };
    expect(produto.quantidade_atual).toBe(3000);
  });

  it('desfazer movimento inexistente retorna nao_encontrado', async () => {
    const { movimentos } = await montarComBaixa();
    const resultado = await movimentos.desfazer('fantasma', clock.agora());
    expect(resultado.ok).toBe(false);
  });
});

describe('reconciliação', () => {
  it('banco coerente retorna zero linhas — estoque inicial vira movimento na criação', async () => {
    const { movimentos, casaId } = await montarComBaixa();
    // ajuste inicial +3000, baixa -1000 → calculado 2000 = materializado 2000
    expect(await movimentos.reconciliar(casaId)).toHaveLength(0);
  });

  it('produto criado zerado com movimentos coerentes não diverge; adulteração externa diverge', async () => {
    const { db, sqlite } = criarDbDeTeste();
    const { casaId, usuarioId } = semearCasaEUsuario(sqlite);
    const produtos = new SQLiteProdutoRepository(db, clock);
    const movimentos = new SQLiteMovimentoRepository(db);
    const dados = validarCadastroProduto({ nome: 'Feijão', unidade: 'un', quantidadeNecessaria: 2 });
    if (!dados.ok) {
      throw new Error('setup');
    }
    const criado = await produtos.criar(casaId, usuarioId, dados.valor);
    if (!criado.ok) {
      throw new Error('setup');
    }
    // reposição via movimento coerente
    sqlite
      .prepare(
        `INSERT INTO movimento_estoque (id, casa_id, produto_id, usuario_id, tipo, quantidade_delta, quantidade_resultante, criado_em)
         VALUES ('m1', ?, ?, ?, 'reposicao', 2000, 2000, 10)`,
      )
      .run(casaId, criado.valor.id, usuarioId);
    sqlite.prepare('UPDATE produto SET quantidade_atual = 2000 WHERE id = ?').run(criado.valor.id);

    expect(await movimentos.reconciliar(casaId)).toHaveLength(0);

    // adulteração fora da transação
    sqlite.prepare('UPDATE produto SET quantidade_atual = 999 WHERE id = ?').run(criado.valor.id);
    const divergencias = await movimentos.reconciliar(casaId);
    expect(divergencias).toHaveLength(1);
    expect(divergencias[0]).toEqual(
      expect.objectContaining({ materializado: 999, calculado: 2000 }),
    );
  });
});

describe('corrigirDivergencia', () => {
  it('grava um movimento de ajuste e leva a quantidade ao valor calculado, nunca em silêncio', async () => {
    const { db, sqlite } = criarDbDeTeste();
    const { casaId, usuarioId } = semearCasaEUsuario(sqlite);
    const produtos = new SQLiteProdutoRepository(db, clock);
    const movimentos = new SQLiteMovimentoRepository(db);
    const dados = validarCadastroProduto({ nome: 'Feijão', unidade: 'un', quantidadeNecessaria: 2 });
    if (!dados.ok) throw new Error('setup');
    const criado = await produtos.criar(casaId, usuarioId, dados.valor);
    if (!criado.ok) throw new Error('setup');
    sqlite.prepare('UPDATE produto SET quantidade_atual = 999 WHERE id = ?').run(criado.valor.id);

    const resultado = await movimentos.corrigirDivergencia(
      criado.valor.id,
      usuarioId,
      milesimos(0),
      clock.agora(),
    );
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor.saldoResultante).toBe(0);
    }
    const produto = sqlite
      .prepare('SELECT quantidade_atual FROM produto WHERE id = ?')
      .get(criado.valor.id) as { quantidade_atual: number };
    expect(produto.quantidade_atual).toBe(0);
    const ajuste = sqlite
      .prepare("SELECT * FROM movimento_estoque WHERE tipo = 'ajuste' AND motivo = 'reconciliacao'")
      .get() as { quantidade_delta: number; quantidade_resultante: number };
    expect(ajuste).toEqual(
      expect.objectContaining({ quantidade_delta: -999, quantidade_resultante: 0 }),
    );
    // O próprio movimento de correção fica fora da soma da reconciliação
    // (design D9) — senão nenhuma correção jamais convergiria.
    expect(await movimentos.reconciliar(casaId)).toHaveLength(0);
  });

  it('produto inexistente retorna nao_encontrado', async () => {
    const { movimentos } = await montarComBaixa();
    const resultado = await movimentos.corrigirDivergencia(
      'fantasma',
      'usuario-teste',
      milesimos(0),
      clock.agora(),
    );
    expect(resultado.ok).toBe(false);
  });
});

describe('corrigirTodasDivergencias', () => {
  async function montarComDuasDivergencias() {
    const { db, sqlite } = criarDbDeTeste();
    const { casaId, usuarioId } = semearCasaEUsuario(sqlite);
    const produtos = new SQLiteProdutoRepository(db, clock);
    const movimentos = new SQLiteMovimentoRepository(db);
    for (const nome of ['Feijão', 'Arroz']) {
      const dados = validarCadastroProduto({ nome, unidade: 'un', quantidadeNecessaria: 2 });
      if (!dados.ok) throw new Error('setup');
      const criado = await produtos.criar(casaId, usuarioId, dados.valor);
      if (!criado.ok) throw new Error('setup');
      // adulteração fora da transação, para cada produto
      sqlite.prepare('UPDATE produto SET quantidade_atual = 999 WHERE id = ?').run(criado.valor.id);
    }
    return { db, sqlite, casaId, usuarioId, produtos, movimentos };
  }

  it('corrige cada produto divergente com seu próprio movimento de ajuste, em uma única transação', async () => {
    const { sqlite, casaId, usuarioId, movimentos } = await montarComDuasDivergencias();

    const resultado = await movimentos.corrigirTodasDivergencias(casaId, usuarioId, clock.agora());
    expect(resultado).toEqual({ corrigidos: 2 });
    expect(await movimentos.reconciliar(casaId)).toHaveLength(0);

    const ajustes = sqlite
      .prepare("SELECT COUNT(*) AS n FROM movimento_estoque WHERE tipo = 'ajuste' AND motivo = 'reconciliacao'")
      .get();
    expect(ajustes).toEqual({ n: 2 });
  });

  it('sem divergência não corrige nada e não falha', async () => {
    const { casaId, usuarioId, movimentos } = await montarComBaixa();
    const resultado = await movimentos.corrigirTodasDivergencias(casaId, usuarioId, clock.agora());
    expect(resultado).toEqual({ corrigidos: 0 });
  });

  it('rollback: falha na correção de um produto não deixa nenhum corrigido', async () => {
    const { sqlite, casaId, movimentos } = await montarComDuasDivergencias();

    // usuário inexistente → INSERT do movimento de ajuste viola FK → transação inteira volta
    await expect(
      movimentos.corrigirTodasDivergencias(casaId, 'usuario-fantasma', clock.agora()),
    ).rejects.toThrow(/FOREIGN KEY/i);

    const divergencias = await movimentos.reconciliar(casaId);
    expect(divergencias).toHaveLength(2);
    expect(
      sqlite.prepare("SELECT COUNT(*) AS n FROM movimento_estoque WHERE tipo = 'ajuste'").get(),
    ).toEqual({ n: 0 });
  });
});

describe('listarTudoParaBackup', () => {
  it('traz o histórico inteiro da casa, sem limite', async () => {
    const { movimentos, casaId, produtoId, usuarioId, sqlite } = await montarComBaixa();
    for (let i = 0; i < 5; i += 1) {
      sqlite
        .prepare(
          `INSERT INTO movimento_estoque (id, casa_id, produto_id, usuario_id, tipo, quantidade_delta, quantidade_resultante, criado_em)
           VALUES (?, ?, ?, ?, 'reposicao', 100, 100, ?)`,
        )
        .run(`extra-${i}`, casaId, produtoId, usuarioId, 10 + i);
    }
    const historico = await movimentos.listarTudoParaBackup(casaId);
    // ajuste inicial + baixa + 5 extras
    expect(historico).toHaveLength(7);
  });
});
