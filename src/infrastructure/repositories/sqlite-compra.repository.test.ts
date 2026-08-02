import { efeitosDaFinalizacao } from '../../domain/compra/compra.rules';
import { validarCadastroProduto } from '../../domain/produto/validacao';
import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { criarDbDeTeste, semearCasaEUsuario } from '../db/teste/criar-db-teste';
import { SQLiteCompraRepository } from './sqlite-compra.repository';
import { SQLiteMovimentoRepository } from './sqlite-movimento.repository';
import { SQLiteProdutoRepository } from './sqlite-produto.repository';

const clock = { agora: () => 1_700_000_000_000 };

async function montar() {
  const { db, sqlite } = criarDbDeTeste();
  const { casaId, usuarioId } = semearCasaEUsuario(sqlite);
  const produtos = new SQLiteProdutoRepository(db, clock);
  const compras = new SQLiteCompraRepository(db);
  const movimentos = new SQLiteMovimentoRepository(db);

  async function criarProduto(nome: string, quantidadeAtual = 0, valorUnitario = 0) {
    const dados = validarCadastroProduto({
      nome,
      unidade: 'un',
      quantidadeNecessaria: 3,
      quantidadeAtual,
      valorUnitario,
    });
    if (!dados.ok) {
      throw new Error('setup');
    }
    const criado = await produtos.criar(casaId, usuarioId, dados.valor);
    if (!criado.ok) {
      throw new Error('setup');
    }
    return criado.valor;
  }

  return { sqlite, casaId, usuarioId, produtos, compras, movimentos, criarProduto };
}

describe('abertura de compra', () => {
  it('abre uma compra e impede uma segunda aberta na mesma casa', async () => {
    const { compras, casaId, usuarioId } = await montar();
    const primeira = await compras.abrir(casaId, usuarioId, clock.agora());
    expect(primeira.ok).toBe(true);
    const segunda = await compras.abrir(casaId, usuarioId, clock.agora() + 1);
    expect(segunda.ok).toBe(false);
    if (!segunda.ok) {
      expect(segunda.erro).toBe('ja_existe_aberta');
    }
    expect(await compras.obterAberta(casaId)).not.toBeNull();
  });
});

describe('itens da compra', () => {
  it('adiciona, edita, ordena e remove itens, inclusive avulsos', async () => {
    const { compras, casaId, usuarioId, criarProduto } = await montar();
    const produto = await criarProduto('Arroz');
    const compra = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!compra.ok) {
      throw new Error('setup');
    }
    const doEstoque = await compras.adicionarItem(compra.valor.id, {
      produtoId: produto.id,
      unidade: 'un',
      quantidadePlanejada: milesimos(2000),
    });
    const avulso = await compras.adicionarItem(compra.valor.id, {
      nomeAvulso: 'Pilha AA',
      unidade: 'un',
      quantidadePlanejada: milesimos(4000),
    });
    expect(avulso.ordem).toBeGreaterThan(doEstoque.ordem);

    await compras.editarItem(avulso.id, { quantidadePlanejada: milesimos(2000) });
    let itens = await compras.listarItens(compra.valor.id);
    expect(itens).toHaveLength(2);
    expect(itens[1].item.quantidadePlanejada).toBe(2000);

    await compras.removerItem(doEstoque.id);
    itens = await compras.listarItens(compra.valor.id);
    expect(itens).toHaveLength(1);
    expect(itens[0].item.nomeAvulso).toBe('Pilha AA');
  });

  it('consulta de itens traz produto por junção externa e avulso não some', async () => {
    const { compras, casaId, usuarioId, criarProduto, sqlite } = await montar();
    const produto = await criarProduto('Arroz', 0, 890);
    const compra = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!compra.ok) {
      throw new Error('setup');
    }
    await compras.adicionarItem(compra.valor.id, {
      produtoId: produto.id,
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });
    await compras.adicionarItem(compra.valor.id, {
      nomeAvulso: 'Pilha AA',
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });

    // contagem de consultas: uma única prepare para a carga inteira
    const originalPrepare = sqlite.prepare.bind(sqlite);
    let consultas = 0;
    (sqlite as unknown as { prepare: typeof sqlite.prepare }).prepare = ((fonte: string) => {
      consultas += 1;
      return originalPrepare(fonte);
    }) as typeof sqlite.prepare;

    const itens = await compras.listarItens(compra.valor.id);
    (sqlite as unknown as { prepare: typeof sqlite.prepare }).prepare = originalPrepare;

    expect(consultas).toBe(1);
    expect(itens).toHaveLength(2);
    expect(itens[0].produto?.nome).toBe('Arroz');
    expect(itens[0].produto?.valorUnitario).toBe(890);
    expect(itens[1].produto).toBeNull();
    expect(itens[1].item.nomeAvulso).toBe('Pilha AA');
  });
});

describe('finalização', () => {
  async function prepararCompraMarcada() {
    const contexto = await montar();
    const { compras, casaId, usuarioId, criarProduto } = contexto;
    const p1 = await criarProduto('Arroz', 1, 890);
    const p2 = await criarProduto('Feijão', 0, 0);
    const p3 = await criarProduto('Café', 0, 2250);
    const compra = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!compra.ok) {
      throw new Error('setup');
    }
    const itens = [
      await compras.adicionarItem(compra.valor.id, {
        produtoId: p1.id,
        unidade: 'un',
        quantidadePlanejada: milesimos(2000),
      }),
      await compras.adicionarItem(compra.valor.id, {
        produtoId: p2.id,
        unidade: 'un',
        quantidadePlanejada: milesimos(3000),
      }),
      await compras.adicionarItem(compra.valor.id, {
        produtoId: p3.id,
        unidade: 'un',
        quantidadePlanejada: milesimos(1000),
      }),
      await compras.adicionarItem(compra.valor.id, {
        nomeAvulso: 'Pilha AA',
        unidade: 'un',
        quantidadePlanejada: milesimos(1000),
      }),
    ];
    return { ...contexto, compra: compra.valor, produtosCriados: [p1, p2, p3], itensCriados: itens };
  }

  it('finalização com três itens marcados repõe, movimenta, atualiza preço confirmado e fecha', async () => {
    const ctx = await prepararCompraMarcada();
    const [p1, p2, p3] = ctx.produtosCriados;
    const [i1, i2, i3, avulso] = ctx.itensCriados;
    await ctx.compras.editarItem(i1.id, {
      comprado: true,
      quantidadeComprada: milesimos(2000),
      valorPagoUnitario: centavos(950),
    });
    await ctx.compras.editarItem(i2.id, {
      comprado: true,
      quantidadeComprada: milesimos(3000),
      valorPagoUnitario: centavos(700),
    });
    await ctx.compras.editarItem(i3.id, {
      comprado: true,
      quantidadeComprada: milesimos(1000),
      valorPagoUnitario: centavos(2250),
    });
    void avulso;

    const itensAtuais = (await ctx.compras.listarItens(ctx.compra.id)).map((i) => i.item);
    const produtosAtuais = await ctx.produtos.listarDespensa(ctx.casaId);
    const efeitos = efeitosDaFinalizacao(itensAtuais, produtosAtuais, new Set([p1.id, p2.id]));
    if (!efeitos.ok) {
      throw new Error('setup: efeitos inválidos');
    }

    const resultado = await ctx.compras.finalizar(
      ctx.compra.id,
      efeitos.valor,
      ctx.usuarioId,
      clock.agora() + 5000,
    );
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor.status).toBe('finalizada');
      expect(resultado.valor.valorTotalPago).toBe(
        Math.round((2000 * 950) / 1000) + Math.round((3000 * 700) / 1000) + 2250,
      );
    }

    const depois = new Map(
      (await ctx.produtos.listarDespensa(ctx.casaId)).map((p) => [p.id, p]),
    );
    expect(depois.get(p1.id)?.quantidadeAtual).toBe(3000); // 1000 + 2000
    expect(depois.get(p2.id)?.quantidadeAtual).toBe(3000);
    expect(depois.get(p3.id)?.quantidadeAtual).toBe(1000);
    expect(depois.get(p1.id)?.valorUnitario).toBe(950); // confirmado
    expect(depois.get(p2.id)?.valorUnitario).toBe(700); // primeiro preço confirmado
    expect(depois.get(p3.id)?.valorUnitario).toBe(2250); // sem divergência

    const reposicoes = ctx.sqlite
      .prepare("SELECT COUNT(*) AS n FROM movimento_estoque WHERE tipo = 'reposicao' AND compra_id = ?")
      .get(ctx.compra.id);
    expect(reposicoes).toEqual({ n: 3 });

    // banco coerente após a finalização
    expect(await ctx.movimentos.reconciliar(ctx.casaId)).toHaveLength(0);
  });

  it('falha no meio: nada muda e a compra continua aberta', async () => {
    const ctx = await prepararCompraMarcada();
    const [p1] = ctx.produtosCriados;
    const [i1] = ctx.itensCriados;
    await ctx.compras.editarItem(i1.id, {
      comprado: true,
      quantidadeComprada: milesimos(2000),
      valorPagoUnitario: centavos(950),
    });
    const itensAtuais = (await ctx.compras.listarItens(ctx.compra.id)).map((i) => i.item);
    const produtosAtuais = await ctx.produtos.listarDespensa(ctx.casaId);
    const efeitos = efeitosDaFinalizacao(itensAtuais, produtosAtuais, new Set());
    if (!efeitos.ok) {
      throw new Error('setup');
    }
    // sabotagem: uma reposição apontando para produto inexistente no meio do lote
    efeitos.valor.reposicoes.push({
      produtoId: 'produto-fantasma',
      novaQuantidade: milesimos(1000),
      movimento: { tipo: 'reposicao', variacao: milesimos(1000) },
    });

    await expect(
      ctx.compras.finalizar(ctx.compra.id, efeitos.valor, ctx.usuarioId, clock.agora() + 5000),
    ).rejects.toThrow();

    const produto = ctx.sqlite
      .prepare('SELECT quantidade_atual FROM produto WHERE id = ?')
      .get(p1.id) as { quantidade_atual: number };
    expect(produto.quantidade_atual).toBe(1000); // intacto
    expect(
      ctx.sqlite.prepare("SELECT COUNT(*) AS n FROM movimento_estoque WHERE tipo = 'reposicao'").get(),
    ).toEqual({ n: 0 });
    const compra = ctx.sqlite
      .prepare('SELECT status FROM compra WHERE id = ?')
      .get(ctx.compra.id) as { status: string };
    expect(compra.status).toBe('aberta');
  });

  it('itens não marcados não geram reposição nem movimento', async () => {
    const ctx = await prepararCompraMarcada();
    const [i1] = ctx.itensCriados;
    await ctx.compras.editarItem(i1.id, {
      comprado: true,
      quantidadeComprada: milesimos(2000),
    });
    const itensAtuais = (await ctx.compras.listarItens(ctx.compra.id)).map((i) => i.item);
    const produtosAtuais = await ctx.produtos.listarDespensa(ctx.casaId);
    const efeitos = efeitosDaFinalizacao(itensAtuais, produtosAtuais, new Set());
    if (!efeitos.ok) {
      throw new Error('setup');
    }
    const resultado = await ctx.compras.finalizar(
      ctx.compra.id,
      efeitos.valor,
      ctx.usuarioId,
      clock.agora() + 5000,
    );
    expect(resultado.ok).toBe(true);
    expect(
      ctx.sqlite.prepare("SELECT COUNT(*) AS n FROM movimento_estoque WHERE tipo = 'reposicao'").get(),
    ).toEqual({ n: 1 });
  });

  it('item avulso não gera reposição e permanece na consulta de itens', async () => {
    const ctx = await prepararCompraMarcada();
    const avulso = ctx.itensCriados[3];
    await ctx.compras.editarItem(avulso.id, {
      comprado: true,
      quantidadeComprada: milesimos(1000),
      valorPagoUnitario: centavos(300),
    });
    const itensAtuais = (await ctx.compras.listarItens(ctx.compra.id)).map((i) => i.item);
    const produtosAtuais = await ctx.produtos.listarDespensa(ctx.casaId);
    const efeitos = efeitosDaFinalizacao(itensAtuais, produtosAtuais, new Set());
    if (!efeitos.ok) {
      throw new Error('setup');
    }
    expect(efeitos.valor.reposicoes).toHaveLength(0);
    const resultado = await ctx.compras.finalizar(
      ctx.compra.id,
      efeitos.valor,
      ctx.usuarioId,
      clock.agora() + 5000,
    );
    expect(resultado.ok).toBe(true);
    const itens = await ctx.compras.listarItens(ctx.compra.id);
    expect(itens.some((i) => i.item.nomeAvulso === 'Pilha AA')).toBe(true);
  });
});
