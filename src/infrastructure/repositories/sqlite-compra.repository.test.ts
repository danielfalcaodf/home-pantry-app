import { efeitosDaFinalizacao } from '../../domain/compra/compra.rules';
import { fatorConversao } from '../../domain/produto/conversao-embalagem.rules';
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

describe('cancelamento de compra', () => {
  it('cancela uma compra aberta, libera o índice único e mantém no histórico', async () => {
    const { compras, casaId, usuarioId } = await montar();
    const aberta = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!aberta.ok) {
      throw new Error('setup');
    }
    const resultado = await compras.cancelar(aberta.valor.id, clock.agora() + 1);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor.status).toBe('cancelada');
    }
    expect(await compras.obterAberta(casaId)).toBeNull();
    // Uma casa nova pode abrir outra compra imediatamente após o cancelamento.
    const novaAberta = await compras.abrir(casaId, usuarioId, clock.agora() + 2);
    expect(novaAberta.ok).toBe(true);
  });

  it('cancelar uma compra já finalizada falha', async () => {
    const { compras, casaId, usuarioId } = await montar();
    const aberta = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!aberta.ok) {
      throw new Error('setup');
    }
    const efeitosVazios = { reposicoes: [], atualizacoesDePreco: [], totalPago: centavos(0) };
    await compras.finalizar(aberta.valor.id, efeitosVazios, usuarioId, clock.agora() + 1);
    const resultado = await compras.cancelar(aberta.valor.id, clock.agora() + 2);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro).toBe('nao_esta_aberta');
    }
  });

  it('cancelar uma compra inexistente falha', async () => {
    const { compras } = await montar();
    const resultado = await compras.cancelar('inexistente', clock.agora());
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro).toBe('nao_encontrada');
    }
  });
});

describe('adicionarItens em lote (achado de QA: "Iniciar compra" lento com muitos itens)', () => {
  it('insere todos os itens numa única transação, com ordem sequencial', async () => {
    const { compras, casaId, usuarioId, criarProduto, sqlite } = await montar();
    const p1 = await criarProduto('Arroz');
    const p2 = await criarProduto('Feijão');
    const compra = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!compra.ok) {
      throw new Error('setup');
    }

    const originalPrepare = sqlite.prepare.bind(sqlite);
    let consultas = 0;
    (sqlite as unknown as { prepare: typeof sqlite.prepare }).prepare = ((fonte: string) => {
      consultas += 1;
      return originalPrepare(fonte);
    }) as typeof sqlite.prepare;

    const criados = await compras.adicionarItens(compra.valor.id, [
      { produtoId: p1.id, unidade: 'un', quantidadePlanejada: milesimos(1000) },
      { produtoId: p2.id, unidade: 'un', quantidadePlanejada: milesimos(2000) },
    ]);
    (sqlite as unknown as { prepare: typeof sqlite.prepare }).prepare = originalPrepare;

    // uma consulta pro máximo de ordem, duas de insert, uma de leitura de
    // volta — bem menos que as ~9 (2 pesquisas de ordem + 2 inserts + 2
    // leituras + overhead) que dois `adicionarItem` sequenciais fariam.
    expect(consultas).toBeLessThanOrEqual(4);
    expect(criados).toHaveLength(2);
    expect(criados[0].ordem).toBe(0);
    expect(criados[1].ordem).toBe(1);
    expect(criados[0].quantidadePlanejada).toBe(1000);
    expect(criados[1].quantidadePlanejada).toBe(2000);

    const itens = await compras.listarItens(compra.valor.id);
    expect(itens).toHaveLength(2);
  });

  it('continua a ordem a partir dos itens já existentes na compra', async () => {
    const { compras, casaId, usuarioId, criarProduto } = await montar();
    const p1 = await criarProduto('Arroz');
    const p2 = await criarProduto('Feijão');
    const compra = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!compra.ok) {
      throw new Error('setup');
    }
    await compras.adicionarItem(compra.valor.id, {
      produtoId: p1.id,
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });

    const [criado] = await compras.adicionarItens(compra.valor.id, [
      { produtoId: p2.id, unidade: 'un', quantidadePlanejada: milesimos(2000) },
    ]);

    expect(criado.ordem).toBe(1);
  });

  it('lista vazia não faz nada e não falha', async () => {
    const { compras, casaId, usuarioId } = await montar();
    const compra = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!compra.ok) {
      throw new Error('setup');
    }
    expect(await compras.adicionarItens(compra.valor.id, [])).toEqual([]);
  });
});

describe('recomecar (change melhorias-usabilidade-modo-compra)', () => {
  it('cancela a compra aberta e materializa a substituta na mesma transação', async () => {
    const { compras, casaId, usuarioId, criarProduto } = await montar();
    const produto = await criarProduto('Arroz');
    const aberta = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!aberta.ok) {
      throw new Error('setup');
    }
    await compras.adicionarItem(aberta.valor.id, {
      produtoId: produto.id,
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });

    const resultado = await compras.recomecar(aberta.valor.id, {
      casaId,
      usuarioId,
      criadaEm: clock.agora() + 1,
      itens: [{ produtoId: produto.id, unidade: 'un', quantidadePlanejada: milesimos(2000) }],
    });

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) {
      throw new Error('assert');
    }
    expect(resultado.valor.id).not.toBe(aberta.valor.id);

    // a antiga vira histórico (cancelada), a nova é a única aberta.
    const antiga = await compras.obterPorId(aberta.valor.id);
    expect(antiga?.status).toBe('cancelada');
    const novaAberta = await compras.obterAberta(casaId);
    expect(novaAberta?.id).toBe(resultado.valor.id);

    const itensDaNova = await compras.listarItens(resultado.valor.id);
    expect(itensDaNova).toHaveLength(1);
    expect(itensDaNova[0].item.quantidadePlanejada).toBe(2000);

    // nunca duas compras abertas ao mesmo tempo (ux_compra_aberta).
    const segundaAbertura = await compras.abrir(casaId, usuarioId, clock.agora() + 2);
    expect(segundaAbertura.ok).toBe(false);
  });

  it('recomeçar uma compra inexistente falha e não cria nada', async () => {
    const { compras, casaId, usuarioId } = await montar();
    const resultado = await compras.recomecar('inexistente', {
      casaId,
      usuarioId,
      criadaEm: clock.agora(),
      itens: [],
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro).toBe('nao_encontrada');
    }
    expect(await compras.obterAberta(casaId)).toBeNull();
  });

  it('recomeçar uma compra já finalizada falha e preserva o histórico intacto', async () => {
    const { compras, casaId, usuarioId } = await montar();
    const aberta = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!aberta.ok) {
      throw new Error('setup');
    }
    const efeitosVazios = { reposicoes: [], atualizacoesDePreco: [], totalPago: centavos(0) };
    await compras.finalizar(aberta.valor.id, efeitosVazios, usuarioId, clock.agora() + 1);

    const resultado = await compras.recomecar(aberta.valor.id, {
      casaId,
      usuarioId,
      criadaEm: clock.agora() + 2,
      itens: [],
    });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro).toBe('nao_esta_aberta');
    }
    // a compra finalizada continua com o status intacto — nada foi alterado.
    expect((await compras.obterPorId(aberta.valor.id))?.status).toBe('finalizada');
    expect(await compras.obterAberta(casaId)).toBeNull();
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

    // ACHADO-036 (task 6.1): não só a contagem — os campos do movimento
    // gravado para um produto específico precisam bater individualmente.
    const movimentoDeP1 = ctx.sqlite
      .prepare(
        'SELECT usuario_id, criado_em, quantidade_delta, quantidade_resultante FROM movimento_estoque WHERE tipo = ? AND compra_id = ? AND produto_id = ?',
      )
      .get('reposicao', ctx.compra.id, p1.id) as {
      usuario_id: string;
      criado_em: number;
      quantidade_delta: number;
      quantidade_resultante: number;
    };
    expect(movimentoDeP1.usuario_id).toBe(ctx.usuarioId);
    expect(movimentoDeP1.criado_em).toBe(clock.agora() + 5000);
    expect(movimentoDeP1.quantidade_delta).toBe(2000); // 1000 (inicial) → 3000
    expect(movimentoDeP1.quantidade_resultante).toBe(3000);

    // banco coerente após a finalização
    expect(await ctx.movimentos.reconciliar(ctx.casaId)).toHaveLength(0);
  });

  it('finalização de item com pacotes aplica o preço derivado na mesma transação (change conversao-unidade-de-compra)', async () => {
    const ctx = await montar();
    const dados = validarCadastroProduto({
      nome: 'Papel higiênico',
      unidade: 'un',
      quantidadeNecessaria: 12,
      quantidadeAtual: 0,
      fatorConversaoEmbalagem: 12,
      valorReferenciaEmbalagem: 12,
    });
    if (!dados.ok) {
      throw new Error('setup');
    }
    const criado = await ctx.produtos.criar(ctx.casaId, ctx.usuarioId, dados.valor);
    if (!criado.ok) {
      throw new Error('setup');
    }
    const produto = criado.valor;
    expect(produto.valorUnitario).toBe(100); // 1200/12

    const compra = await ctx.compras.abrir(ctx.casaId, ctx.usuarioId, clock.agora());
    if (!compra.ok) {
      throw new Error('setup');
    }
    const item = await ctx.compras.adicionarItem(compra.valor.id, {
      produtoId: produto.id,
      unidade: 'un',
      quantidadePlanejada: milesimos(12000),
    });

    // Mercado tinha pacote de 16, não 12 — grava a rastreabilidade e o preço
    // derivado (1600/16 = 100/un), sem alterar o fator cadastrado no produto.
    await ctx.compras.editarItem(item.id, {
      comprado: true,
      quantidadeComprada: milesimos(16000),
      quantidadePacotes: 1,
      fatorUsadoNaCompra: fatorConversao(16),
      valorPagoUnitario: centavos(100),
    });

    const relido = (await ctx.compras.listarItens(compra.valor.id))[0];
    expect(relido.item.quantidadePacotes).toBe(1);
    expect(relido.item.fatorUsadoNaCompra).toBe(16);
    expect(relido.produto?.fatorConversaoEmbalagem).toBe(12);

    const itensAtuais = (await ctx.compras.listarItens(compra.valor.id)).map((i) => i.item);
    const produtosAtuais = await ctx.produtos.listarDespensa(ctx.casaId);
    const efeitos = efeitosDaFinalizacao(itensAtuais, produtosAtuais, new Set());
    if (!efeitos.ok) {
      throw new Error('setup: efeitos inválidos');
    }
    const finalizada = await ctx.compras.finalizar(
      compra.valor.id,
      efeitos.valor,
      ctx.usuarioId,
      clock.agora() + 1000,
    );
    expect(finalizada.ok).toBe(true);

    const produtoDepois = await ctx.produtos.obterPorId(produto.id);
    expect(produtoDepois?.quantidadeAtual).toBe(16000);
    // Divergência de tamanho de pacote nunca retroalimenta o cadastro.
    expect(produtoDepois?.fatorConversaoEmbalagem).toBe(12);
    expect(produtoDepois?.valorUnitario).toBe(100); // sem divergência de preço aqui
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

describe('avulsos não tocam o estoque', () => {
  it('adicionar avulso não cria produto na despensa nem grava movimento', async () => {
    const { compras, produtos, movimentos, casaId, usuarioId } = await montar();
    const compra = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!compra.ok) {
      throw new Error('setup');
    }
    await compras.adicionarItem(compra.valor.id, {
      nomeAvulso: 'Pilha AA',
      unidade: 'un',
      quantidadePlanejada: milesimos(2000),
      valorEstimadoUnit: centavos(900),
    });

    expect(await produtos.listarDespensa(casaId)).toHaveLength(0);
    expect(await movimentos.historicoPorCasa(casaId, 10)).toHaveLength(0);
  });
});

describe('unicidade da compra aberta sob concorrência', () => {
  it('duas aberturas em sequência rápida para a mesma casa: só a primeira vence', async () => {
    const { compras, casaId, usuarioId } = await montar();
    const resultados = await Promise.all([
      compras.abrir(casaId, usuarioId, clock.agora()),
      compras.abrir(casaId, usuarioId, clock.agora()),
    ]);
    const sucessos = resultados.filter((r) => r.ok);
    const falhas = resultados.filter((r) => !r.ok);
    expect(sucessos).toHaveLength(1);
    expect(falhas).toHaveLength(1);
  });
});

describe('exclusão de faltante da lista', () => {
  it('marcação de exclusão sobrevive à reabertura e morre com o fechamento da compra', async () => {
    const { compras, produtos, movimentos, casaId, usuarioId, criarProduto } = await montar();
    const arroz = await criarProduto('Arroz', 0);

    const compra1 = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!compra1.ok) {
      throw new Error('setup');
    }
    const exclusao = await compras.adicionarItem(compra1.valor.id, {
      produtoId: arroz.id,
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
      excluido: true,
    });

    // "reabertura da tela": relistar os itens da mesma compra aberta.
    let itens = await compras.listarItens(compra1.valor.id);
    expect(itens.find((i) => i.item.id === exclusao.id)?.item.excluido).toBe(true);

    // Fecha a compra sem marcar nada como comprado.
    const efeitos = efeitosDaFinalizacao([], [arroz], new Set());
    if (!efeitos.ok) {
      throw new Error('setup');
    }
    const fechada = await compras.finalizar(compra1.valor.id, efeitos.valor, usuarioId, clock.agora() + 1);
    expect(fechada.ok).toBe(true);

    // A exclusão morria com a compra: nenhuma compra aberta a contém mais.
    expect(await compras.obterAberta(casaId)).toBeNull();
    expect(await produtos.listarFaltantes(casaId)).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: arroz.id })]),
    );
    expect(await movimentos.historicoPorCasa(casaId, 10)).toHaveLength(0);
  });

  // ACHADO (correcao-lista-de-compras): editarItem agora aceita `excluido`
  // — usado por useRemoverItemDaLista pra reaproveitar uma linha já
  // materializada por iniciarCompra em vez de inserir uma segunda linha
  // pro mesmo produto (o que escondia o produto da lista pra sempre).
  it('editarItem grava excluido no banco real, nos dois sentidos', async () => {
    const { compras, casaId, usuarioId, criarProduto } = await montar();
    const arroz = await criarProduto('Arroz', 0);

    const compra = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!compra.ok) {
      throw new Error('setup');
    }
    const item = await compras.adicionarItem(compra.valor.id, {
      produtoId: arroz.id,
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });
    expect(item.excluido).toBe(false);

    await compras.editarItem(item.id, { excluido: true });
    let itens = await compras.listarItens(compra.valor.id);
    expect(itens.find((i) => i.item.id === item.id)?.item.excluido).toBe(true);

    await compras.editarItem(item.id, { excluido: false });
    itens = await compras.listarItens(compra.valor.id);
    expect(itens.find((i) => i.item.id === item.id)?.item.excluido).toBe(false);
  });
});

describe('itens planejados sobrevivem a consumo posterior', () => {
  it('consumo registrado após iniciar a compra não altera a quantidade planejada do item', async () => {
    const { compras, produtos, casaId, usuarioId, criarProduto } = await montar();
    const arroz = await criarProduto('Arroz', 500, 890);
    const compra = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!compra.ok) {
      throw new Error('setup');
    }
    const item = await compras.adicionarItem(compra.valor.id, {
      produtoId: arroz.id,
      unidade: 'un',
      quantidadePlanejada: milesimos(1500),
      valorEstimadoUnit: centavos(890),
    });

    // Consumo altera o produto — nunca o item já materializado na compra.
    await produtos.darBaixa({
      produtoId: arroz.id,
      quantidade: milesimos(300),
      usuarioId,
      criadoEm: clock.agora() + 1,
    });

    const itens = await compras.listarItens(compra.valor.id);
    expect(itens.find((i) => i.item.id === item.id)?.item.quantidadePlanejada).toBe(1500);
  });
});

describe('escala e retorno à lista (tasks 7.1, 7.4)', () => {
  it('fechamento bem-sucedido com oito itens marcados de quinze', async () => {
    const { compras, produtos, casaId, usuarioId, criarProduto, sqlite } = await montar();
    const produtosCriados = [];
    for (let i = 0; i < 15; i++) {
      produtosCriados.push(await criarProduto(`Produto ${i}`, 0, 500));
    }
    const compra = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!compra.ok) {
      throw new Error('setup');
    }
    const itensCriados = [];
    for (const p of produtosCriados) {
      itensCriados.push(
        await compras.adicionarItem(compra.valor.id, {
          produtoId: p.id,
          unidade: 'un',
          quantidadePlanejada: milesimos(1000),
          valorEstimadoUnit: centavos(500),
        }),
      );
    }
    expect(itensCriados).toHaveLength(15);

    for (const item of itensCriados.slice(0, 8)) {
      await compras.editarItem(item.id, {
        comprado: true,
        quantidadeComprada: milesimos(1000),
        valorPagoUnitario: centavos(500),
      });
    }

    const itensAtuais = (await compras.listarItens(compra.valor.id)).map((i) => i.item);
    const produtosAtuais = await produtos.listarDespensa(casaId);
    const efeitos = efeitosDaFinalizacao(itensAtuais, produtosAtuais, new Set());
    if (!efeitos.ok) {
      throw new Error('setup');
    }
    expect(efeitos.valor.reposicoes).toHaveLength(8);

    const resultado = await compras.finalizar(compra.valor.id, efeitos.valor, usuarioId, clock.agora() + 1);
    expect(resultado.ok).toBe(true);
    expect(resultado.ok && resultado.valor.valorTotalPago).toBe(8 * 500);

    const reposicoes = sqlite
      .prepare("SELECT COUNT(*) AS n FROM movimento_estoque WHERE tipo = 'reposicao' AND compra_id = ?")
      .get(compra.valor.id);
    expect(reposicoes).toEqual({ n: 8 });
  });

  it('itens não marcados voltam à lista quando o produto continua abaixo do mínimo', async () => {
    const { compras, produtos, casaId, usuarioId, criarProduto } = await montar();
    // Ambos começam abaixo do mínimo (necessária fixa em 3, do helper).
    const repostoNoFechamento = await criarProduto('Arroz', 0, 500);
    const deixadoDeFora = await criarProduto('Feijão', 0, 500);
    const compra = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!compra.ok) {
      throw new Error('setup');
    }
    const item1 = await compras.adicionarItem(compra.valor.id, {
      produtoId: repostoNoFechamento.id,
      unidade: 'un',
      quantidadePlanejada: milesimos(3000),
      valorEstimadoUnit: centavos(500),
    });
    await compras.adicionarItem(compra.valor.id, {
      produtoId: deixadoDeFora.id,
      unidade: 'un',
      quantidadePlanejada: milesimos(3000),
      valorEstimadoUnit: centavos(500),
    });
    // Só o primeiro é marcado — o segundo fica pendente.
    await compras.editarItem(item1.id, {
      comprado: true,
      quantidadeComprada: milesimos(3000),
      valorPagoUnitario: centavos(500),
    });

    const itensAtuais = (await compras.listarItens(compra.valor.id)).map((i) => i.item);
    const produtosAtuais = await produtos.listarDespensa(casaId);
    const efeitos = efeitosDaFinalizacao(itensAtuais, produtosAtuais, new Set());
    if (!efeitos.ok) {
      throw new Error('setup');
    }
    await compras.finalizar(compra.valor.id, efeitos.valor, usuarioId, clock.agora() + 1);

    const faltantes = await produtos.listarFaltantes(casaId);
    // O reposto sai da lista (chegou à necessária); o não marcado continua.
    expect(faltantes.map((f) => f.id)).not.toContain(repostoNoFechamento.id);
    expect(faltantes.map((f) => f.id)).toContain(deixadoDeFora.id);
  });
});

describe('gastoPorMes', () => {
  async function finalizarComTotal(
    compras: Awaited<ReturnType<typeof montar>>['compras'],
    casaId: string,
    usuarioId: string,
    finalizadaEm: number,
    totalPago: number,
  ) {
    const aberta = await compras.abrir(casaId, usuarioId, finalizadaEm - 1000);
    if (!aberta.ok) throw new Error('setup');
    await compras.finalizar(
      aberta.valor.id,
      { reposicoes: [], atualizacoesDePreco: [], totalPago: centavos(totalPago) },
      usuarioId,
      finalizadaEm,
    );
    return aberta.valor.id;
  }

  it('agrega o total pago e a contagem de compras por mês, do mais recente ao mais antigo', async () => {
    const { compras, casaId, usuarioId } = await montar();
    await finalizarComTotal(compras, casaId, usuarioId, Date.UTC(2026, 6, 10), 5000);
    await finalizarComTotal(compras, casaId, usuarioId, Date.UTC(2026, 6, 20), 3000);
    await finalizarComTotal(compras, casaId, usuarioId, Date.UTC(2026, 5, 5), 1000);

    const gastos = await compras.gastoPorMes(casaId, Date.UTC(2025, 0, 1));

    expect(gastos).toEqual([
      { mes: '2026-07', totalPago: 8000, qtdCompras: 2 },
      { mes: '2026-06', totalPago: 1000, qtdCompras: 1 },
    ]);
  });

  it('compra fechada perto da meia-noite do último dia do mês cai no mês correto (task 3.8)', async () => {
    const { compras, casaId, usuarioId } = await montar();
    // 31/01 23:30 UTC == 23:30 no fuso local deste processo (TZ=UTC) — o
    // ponto é exercitar o mesmo modificador 'localtime' da DATABASE §6.5.
    const pertoDaMeiaNoite = Date.UTC(2026, 0, 31, 23, 30, 0);
    await finalizarComTotal(compras, casaId, usuarioId, pertoDaMeiaNoite, 4200);

    const gastos = await compras.gastoPorMes(casaId, Date.UTC(2025, 0, 1));

    expect(gastos).toEqual([{ mes: '2026-01', totalPago: 4200, qtdCompras: 1 }]);
  });

  it('compras abertas e canceladas não entram no gasto (task 3.9)', async () => {
    const { compras, casaId, usuarioId } = await montar();
    // Só uma compra aberta por vez (ux_compra_aberta): cancela antes de
    // abrir a que fica pendente até o fim do teste.
    const cancelada = await compras.abrir(casaId, usuarioId, Date.UTC(2026, 6, 2));
    if (!cancelada.ok) throw new Error('setup');
    await compras.cancelar(cancelada.valor.id, Date.UTC(2026, 6, 3));

    await compras.abrir(casaId, usuarioId, Date.UTC(2026, 6, 1)); // fica aberta

    const gastos = await compras.gastoPorMes(casaId, Date.UTC(2025, 0, 1));

    expect(gastos).toEqual([]);
  });

  it('respeita o corte de "desde" e não traz meses anteriores', async () => {
    const { compras, casaId, usuarioId } = await montar();
    await finalizarComTotal(compras, casaId, usuarioId, Date.UTC(2024, 0, 15), 999);
    await finalizarComTotal(compras, casaId, usuarioId, Date.UTC(2026, 6, 15), 100);

    const gastos = await compras.gastoPorMes(casaId, Date.UTC(2025, 0, 1));

    expect(gastos).toEqual([{ mes: '2026-07', totalPago: 100, qtdCompras: 1 }]);
  });

  // ACHADO-046: compra finalizada sem itens marcados (totalPago zero) precisa
  // contar na quantidade de compras do mês, sem distorcer o total pago.
  it('compra finalizada com total zero entra na contagem do mês sem distorcer o total pago', async () => {
    const { compras, casaId, usuarioId } = await montar();
    await finalizarComTotal(compras, casaId, usuarioId, Date.UTC(2026, 6, 10), 0);

    const gastos = await compras.gastoPorMes(casaId, Date.UTC(2025, 0, 1));

    expect(gastos).toEqual([{ mes: '2026-07', totalPago: 0, qtdCompras: 1 }]);
  });

  it('compra com total zero no mesmo mês de outras com valor não altera o total pago das demais', async () => {
    const { compras, casaId, usuarioId } = await montar();
    await finalizarComTotal(compras, casaId, usuarioId, Date.UTC(2026, 6, 5), 5000);
    await finalizarComTotal(compras, casaId, usuarioId, Date.UTC(2026, 6, 10), 0);
    await finalizarComTotal(compras, casaId, usuarioId, Date.UTC(2026, 6, 20), 3000);

    const gastos = await compras.gastoPorMes(casaId, Date.UTC(2025, 0, 1));

    expect(gastos).toEqual([{ mes: '2026-07', totalPago: 8000, qtdCompras: 3 }]);
  });
});

describe('obterPorId', () => {
  it('encontra uma compra por id em qualquer status', async () => {
    const { compras, casaId, usuarioId } = await montar();
    const aberta = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!aberta.ok) throw new Error('setup');

    const encontrada = await compras.obterPorId(aberta.valor.id);
    expect(encontrada?.id).toBe(aberta.valor.id);
  });

  it('retorna null para id inexistente', async () => {
    const { compras } = await montar();
    expect(await compras.obterPorId('inexistente')).toBeNull();
  });
});

describe('detalhe da compra — obterPorId + listarItens, sem N+1 (task 5.6)', () => {
  it('carrega a compra e os itens em exatamente duas consultas, com qualquer quantidade de itens', async () => {
    const { compras, casaId, usuarioId, criarProduto, sqlite } = await montar();
    const aberta = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!aberta.ok) throw new Error('setup');
    for (let i = 0; i < 10; i++) {
      const produto = await criarProduto(`Produto ${i}`, 0, 500);
      await compras.adicionarItem(aberta.valor.id, {
        produtoId: produto.id,
        unidade: 'un',
        quantidadePlanejada: milesimos(1000),
      });
    }

    const originalPrepare = sqlite.prepare.bind(sqlite);
    let consultas = 0;
    (sqlite as unknown as { prepare: typeof sqlite.prepare }).prepare = ((fonte: string) => {
      consultas += 1;
      return originalPrepare(fonte);
    }) as typeof sqlite.prepare;

    const compra = await compras.obterPorId(aberta.valor.id);
    const itens = await compras.listarItens(aberta.valor.id);
    (sqlite as unknown as { prepare: typeof sqlite.prepare }).prepare = originalPrepare;

    expect(consultas).toBe(2);
    expect(compra).not.toBeNull();
    expect(itens).toHaveLength(10);
  });

  it('produto removido logicamente após a compra não derruba o detalhe — item continua aparecendo (task 5.4, 5.7)', async () => {
    const { compras, produtos, casaId, usuarioId, criarProduto } = await montar();
    const produto = await criarProduto('Arroz', 0, 500);
    const aberta = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!aberta.ok) throw new Error('setup');
    const item = await compras.adicionarItem(aberta.valor.id, {
      produtoId: produto.id,
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });

    // Remoção lógica (a única forma real de "remover" um produto no app —
    // CLAUDE.md, "a remoção de produto é lógica"): a linha continua
    // existindo, então o vínculo permanece (design D7) e a junção externa
    // ainda encontra o produto.
    await produtos.removerLogicamente(produto.id);

    const itens = await compras.listarItens(aberta.valor.id);
    expect(itens).toHaveLength(1);
    expect(itens[0].item.id).toBe(item.id);
    expect(itens[0].produto?.nome).toBe('Arroz');
  });

  it('avulso (produtoId null desde a origem) aparece com produto null, sem quebrar o detalhe', async () => {
    const { compras, casaId, usuarioId } = await montar();
    const aberta = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!aberta.ok) throw new Error('setup');
    await compras.adicionarItem(aberta.valor.id, {
      nomeAvulso: 'Pilha AA',
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });

    const itens = await compras.listarItens(aberta.valor.id);
    expect(itens).toHaveLength(1);
    expect(itens[0].produto).toBeNull();
    expect(itens[0].item.nomeAvulso).toBe('Pilha AA');
  });
});

describe('listarHistorico', () => {
  async function finalizar(
    compras: Awaited<ReturnType<typeof montar>>['compras'],
    casaId: string,
    usuarioId: string,
    finalizadaEm: number,
    totalPago = 1000,
  ) {
    const aberta = await compras.abrir(casaId, usuarioId, finalizadaEm - 1000);
    if (!aberta.ok) throw new Error('setup');
    const resultado = await compras.finalizar(
      aberta.valor.id,
      { reposicoes: [], atualizacoesDePreco: [], totalPago: centavos(totalPago) },
      usuarioId,
      finalizadaEm,
    );
    if (!resultado.ok) throw new Error('setup');
    return resultado.valor;
  }

  async function cancelar(
    compras: Awaited<ReturnType<typeof montar>>['compras'],
    casaId: string,
    usuarioId: string,
    canceladaEm: number,
  ) {
    const aberta = await compras.abrir(casaId, usuarioId, canceladaEm - 1000);
    if (!aberta.ok) throw new Error('setup');
    const resultado = await compras.cancelar(aberta.valor.id, canceladaEm);
    if (!resultado.ok) throw new Error('setup');
    return resultado.valor;
  }

  it('traz finalizadas e canceladas, do mais recente ao mais antigo, mas não a que está aberta', async () => {
    const { compras, casaId, usuarioId } = await montar();
    const f1 = await finalizar(compras, casaId, usuarioId, 1000);
    const c1 = await cancelar(compras, casaId, usuarioId, 2000);
    await compras.abrir(casaId, usuarioId, 3000); // fica aberta, não deve aparecer

    const historico = await compras.listarHistorico(casaId);

    expect(historico.map((h) => h.compra.id)).toEqual([c1.id, f1.id]);
  });

  it('pagina por data de referência, não por deslocamento numérico (tasks 4.4, 4.5)', async () => {
    const { compras, casaId, usuarioId } = await montar();
    const antigas = [];
    for (let i = 0; i < 5; i++) {
      antigas.push(await finalizar(compras, casaId, usuarioId, 1000 + i * 1000));
    }

    const primeiroBloco = await compras.listarHistorico(casaId, { limite: 2 });
    expect(primeiroBloco).toHaveLength(2);
    expect(primeiroBloco.map((h) => h.compra.id)).toEqual([antigas[4].id, antigas[3].id]);

    const ultimaData = primeiroBloco[primeiroBloco.length - 1].compra.finalizadaEm as number;
    const segundoBloco = await compras.listarHistorico(casaId, { limite: 2, antesDe: ultimaData });
    expect(segundoBloco.map((h) => h.compra.id)).toEqual([antigas[2].id, antigas[1].id]);
  });

  it('cancelada usa atualizadoEm como data de referência, e ordena corretamente entre finalizadas', async () => {
    const { compras, casaId, usuarioId } = await montar();
    const f1 = await finalizar(compras, casaId, usuarioId, 1000);
    const c1 = await cancelar(compras, casaId, usuarioId, 2000);
    const f2 = await finalizar(compras, casaId, usuarioId, 3000);

    const historico = await compras.listarHistorico(casaId);

    expect(historico.map((h) => h.compra.id)).toEqual([f2.id, c1.id, f1.id]);
  });

  it('traz a contagem de itens comprados por uma junção agregada, sem consulta por linha (task 5.2/§6.7)', async () => {
    const { compras, casaId, usuarioId, criarProduto, sqlite } = await montar();
    const p1 = await criarProduto('Arroz', 0, 500);
    const p2 = await criarProduto('Feijão', 0, 500);
    const aberta = await compras.abrir(casaId, usuarioId, 1);
    if (!aberta.ok) throw new Error('setup');
    const i1 = await compras.adicionarItem(aberta.valor.id, {
      produtoId: p1.id,
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });
    await compras.adicionarItem(aberta.valor.id, {
      produtoId: p2.id,
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    }); // não marcado como comprado
    await compras.editarItem(i1.id, {
      comprado: true,
      quantidadeComprada: milesimos(1000),
      valorPagoUnitario: centavos(500),
    });
    await compras.finalizar(
      aberta.valor.id,
      { reposicoes: [], atualizacoesDePreco: [], totalPago: centavos(500) },
      usuarioId,
      2000,
    );

    const originalPrepare = sqlite.prepare.bind(sqlite);
    let consultas = 0;
    (sqlite as unknown as { prepare: typeof sqlite.prepare }).prepare = ((fonte: string) => {
      consultas += 1;
      return originalPrepare(fonte);
    }) as typeof sqlite.prepare;

    const historico = await compras.listarHistorico(casaId);
    (sqlite as unknown as { prepare: typeof sqlite.prepare }).prepare = originalPrepare;

    expect(consultas).toBe(1);
    expect(historico).toHaveLength(1);
    expect(historico[0].qtdItensComprados).toBe(1);
  });

  it('não retorna histórico de outra casa', async () => {
    const { compras, casaId, usuarioId, sqlite } = await montar();
    await finalizar(compras, casaId, usuarioId, 1000);
    sqlite
      .prepare('INSERT INTO casa (id, nome, criada_em, atualizado_em) VALUES (?, ?, 0, 0)')
      .run('outra-casa', 'Outra casa');
    expect(await compras.listarHistorico('outra-casa')).toHaveLength(0);
  });
});

describe('listarTudoParaBackup', () => {
  it('traz compras de todos os status, cada uma com seus itens', async () => {
    const { casaId, usuarioId, compras, criarProduto } = await montar();
    const produto = await criarProduto('Arroz', 0, 500);

    const aberta = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!aberta.ok) throw new Error('setup');
    await compras.adicionarItem(aberta.valor.id, {
      produtoId: produto.id,
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
      valorEstimadoUnit: centavos(500),
    });
    await compras.cancelar(aberta.valor.id, clock.agora() + 1);

    const segunda = await compras.abrir(casaId, usuarioId, clock.agora() + 2);
    if (!segunda.ok) throw new Error('setup');

    const backup = await compras.listarTudoParaBackup(casaId);
    expect(backup).toHaveLength(2);
    expect(backup.map((c) => c.compra.status).sort()).toEqual(['aberta', 'cancelada']);
    const cancelada = backup.find((c) => c.compra.status === 'cancelada');
    expect(cancelada?.itens).toHaveLength(1);
    expect(cancelada?.itens[0].produtoId).toBe(produto.id);
  });

  it('não retorna compras de outra casa', async () => {
    const { compras, sqlite } = await montar();
    sqlite
      .prepare('INSERT INTO casa (id, nome, criada_em, atualizado_em) VALUES (?, ?, 0, 0)')
      .run('outra-casa', 'Outra casa');
    const outros = await compras.listarTudoParaBackup('outra-casa');
    expect(outros).toHaveLength(0);
  });
});
