import { validarCadastroProduto } from '../../domain/produto/validacao';
import { centavos, converterValorBruto } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { criarDbDeTeste, semearCasaEUsuario } from '../db/teste/criar-db-teste';
import { SQLiteCompraRepository } from './sqlite-compra.repository';
import { SQLiteProdutoRepository } from './sqlite-produto.repository';

const clock = { agora: () => 1_700_000_000_000 };

function montar() {
  const { db, sqlite } = criarDbDeTeste();
  const { casaId, usuarioId } = semearCasaEUsuario(sqlite);
  const repo = new SQLiteProdutoRepository(db, clock);
  return { repo, sqlite, casaId, usuarioId };
}

// Compras entram só nos testes de `removerLogicamente` que provam a limpeza
// de `compra_item` — os demais testes deste arquivo não precisam da dependência.
function montarComCompra() {
  const { db, sqlite } = criarDbDeTeste();
  const { casaId, usuarioId } = semearCasaEUsuario(sqlite);
  const repo = new SQLiteProdutoRepository(db, clock);
  const compras = new SQLiteCompraRepository(db);
  return { repo, compras, sqlite, casaId, usuarioId };
}

function dadosValidos(nome = 'Arroz', quantidadeAtual = 0) {
  const resultado = validarCadastroProduto({
    nome,
    unidade: 'pacote',
    quantidadeNecessaria: 3,
    quantidadeAtual,
    valorUnitario: 890,
  });
  if (!resultado.ok) {
    throw new Error('fixture inválida');
  }
  return resultado.valor;
}

describe('criação e unicidade de nome', () => {
  it('cria produto e retorna a entidade completa', async () => {
    const { repo, casaId, usuarioId } = montar();
    const resultado = await repo.criar(casaId, usuarioId, dadosValidos());
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor.nome).toBe('Arroz');
      expect(resultado.valor.quantidadeNecessaria).toBe(3000);
    }
  });

  it('nome duplicado é rejeitado, inclusive com caixa diferente', async () => {
    const { repo, casaId, usuarioId } = montar();
    await repo.criar(casaId, usuarioId, dadosValidos('Arroz'));
    const duplicado = await repo.criar(casaId, usuarioId, dadosValidos('arroz'));
    expect(duplicado.ok).toBe(false);
    if (!duplicado.ok) {
      expect(duplicado.erro).toBe('nome_duplicado');
    }
  });

  it('nome de produto removido logicamente pode ser reutilizado', async () => {
    const { repo, casaId, usuarioId } = montar();
    const primeiro = await repo.criar(casaId, usuarioId, dadosValidos('Arroz'));
    if (!primeiro.ok) {
      throw new Error('setup');
    }
    await repo.removerLogicamente(primeiro.valor.id);
    const segundo = await repo.criar(casaId, usuarioId, dadosValidos('Arroz'));
    expect(segundo.ok).toBe(true);
  });
});

describe('edição e remoção lógica', () => {
  it('edita campos e marca sync pendente', async () => {
    const { repo, casaId, usuarioId } = montar();
    const criado = await repo.criar(casaId, usuarioId, dadosValidos());
    if (!criado.ok) {
      throw new Error('setup');
    }
    const editado = await repo.editar(criado.valor.id, { nome: 'Arroz integral' });
    expect(editado.ok).toBe(true);
    if (editado.ok) {
      expect(editado.valor.nome).toBe('Arroz integral');
      expect(editado.valor.syncStatus).toBe('pendente');
    }
  });

  it('persiste todos os campos opcionais da seção "Mais opções"', async () => {
    const { repo, casaId, usuarioId } = montar();
    const criado = await repo.criar(casaId, usuarioId, dadosValidos());
    if (!criado.ok) {
      throw new Error('setup');
    }

    await repo.editar(criado.valor.id, {
      valorUnitario: centavos(1299),
      categoria: 'Despensa',
      marcaPreferida: 'Marca boa',
      observacao: 'Pote de vidro',
    });
    const relido = await repo.obterPorId(criado.valor.id);

    expect(relido).toMatchObject({
      valorUnitario: 1299,
      categoria: 'Despensa',
      marcaPreferida: 'Marca boa',
      observacao: 'Pote de vidro',
    });
  });

  it('persiste campo principal e opcional na mesma edição', async () => {
    const { repo, casaId, usuarioId } = montar();
    const criado = await repo.criar(casaId, usuarioId, dadosValidos());
    if (!criado.ok) {
      throw new Error('setup');
    }

    await repo.editar(criado.valor.id, {
      quantidadeNecessaria: milesimos(5000),
      observacao: 'Pote de vidro',
    });
    const relido = await repo.obterPorId(criado.valor.id);

    expect(relido).toMatchObject({
      quantidadeNecessaria: 5000,
      observacao: 'Pote de vidro',
    });
  });

  it('preserva campos opcionais existentes quando a edição não os altera', async () => {
    const { repo, casaId, usuarioId } = montar();
    const criado = await repo.criar(casaId, usuarioId, dadosValidos());
    if (!criado.ok) {
      throw new Error('setup');
    }

    await repo.editar(criado.valor.id, {
      marcaPreferida: 'Marca boa',
      observacao: 'Pote de vidro',
    });
    await repo.editar(criado.valor.id, { nome: 'Arroz integral' });
    const relido = await repo.obterPorId(criado.valor.id);

    expect(relido).toMatchObject({
      nome: 'Arroz integral',
      marcaPreferida: 'Marca boa',
      observacao: 'Pote de vidro',
    });
  });

  it('editar produto inexistente retorna nao_encontrado', async () => {
    const { repo } = montar();
    const resultado = await repo.editar('fantasma', { nome: 'X' });
    expect(resultado.ok).toBe(false);
  });

  it('removido some da despensa mas permanece no banco', async () => {
    const { repo, casaId, usuarioId, sqlite } = montar();
    const criado = await repo.criar(casaId, usuarioId, dadosValidos());
    if (!criado.ok) {
      throw new Error('setup');
    }
    await repo.removerLogicamente(criado.valor.id);
    expect(await repo.listarDespensa(casaId)).toHaveLength(0);
    const linha = sqlite
      .prepare('SELECT deletado_em FROM produto WHERE id = ?')
      .get(criado.valor.id) as { deletado_em: number };
    expect(linha.deletado_em).not.toBeNull();
  });
});

describe('consultas de leitura', () => {
  // ACHADO-014: listarDespensa alinhada a .select({...}) explícito, como
  // listarFaltantes — este teste prova que nenhum campo consumido pelo
  // domínio (paraDominio) foi omitido ao nomear as colunas.
  it('despensa retorna exatamente os campos esperados de Produto', async () => {
    const { repo, casaId, usuarioId } = montar();
    await repo.criar(casaId, usuarioId, dadosValidos('Arroz', 2));

    const [item] = await repo.listarDespensa(casaId);

    expect(item).toEqual({
      id: expect.any(String),
      casaId,
      nome: 'Arroz',
      categoria: null,
      unidade: 'pacote',
      quantidadeAtual: expect.any(Number),
      quantidadeNecessaria: expect.any(Number),
      valorUnitario: expect.any(Number),
      marcaPreferida: null,
      observacao: null,
      ativo: true,
      criadoEm: expect.any(Number),
      atualizadoEm: expect.any(Number),
      deletadoEm: null,
      syncStatus: expect.any(String),
    });
  });

  it('despensa ordena por estado (crítico, falta, ok) e alfabético dentro do grupo', async () => {
    const { repo, casaId, usuarioId } = montar();
    await repo.criar(casaId, usuarioId, dadosValidos('Zerado', 0));
    await repo.criar(casaId, usuarioId, dadosValidos('Cheio', 3));
    await repo.criar(casaId, usuarioId, dadosValidos('Baixo', 1));
    await repo.criar(casaId, usuarioId, dadosValidos('Acabando', 1));
    const nomes = (await repo.listarDespensa(casaId)).map((p) => p.nome);
    expect(nomes).toEqual(['Zerado', 'Acabando', 'Baixo', 'Cheio']);
  });

  it('faltantes retorna diferença bruta sem arredondar', async () => {
    const { repo, casaId, usuarioId } = montar();
    const criado = await repo.criar(casaId, usuarioId, dadosValidos('Arroz', 2.5));
    if (!criado.ok) {
      throw new Error('setup');
    }
    const faltantes = await repo.listarFaltantes(casaId);
    expect(faltantes).toHaveLength(1);
    expect(faltantes[0].faltaBruta).toBe(500); // bruto: 0,5 pacote, sem arredondar
  });

  it('busca por nome é parcial e categorias vêm distintas', async () => {
    const { repo, casaId, usuarioId } = montar();
    const a = validarCadastroProduto({
      nome: 'Arroz branco',
      unidade: 'un',
      quantidadeNecessaria: 1,
      categoria: 'grãos',
    });
    const b = validarCadastroProduto({
      nome: 'Arroz integral',
      unidade: 'un',
      quantidadeNecessaria: 1,
      categoria: 'Grãos',
    });
    if (!a.ok || !b.ok) {
      throw new Error('setup');
    }
    await repo.criar(casaId, usuarioId, a.valor);
    await repo.criar(casaId, usuarioId, b.valor);
    expect(await repo.buscarPorNome(casaId, 'integral')).toHaveLength(1);
    expect(await repo.listarCategorias(casaId)).toEqual(['Grãos']);
  });
});

describe('darBaixa — transação do caminho crítico', () => {
  it('atualiza a quantidade e grava o movimento juntos', async () => {
    const { repo, casaId, usuarioId, sqlite } = montar();
    const criado = await repo.criar(casaId, usuarioId, dadosValidos('Arroz', 3));
    if (!criado.ok) {
      throw new Error('setup');
    }
    const baixa = await repo.darBaixa({
      produtoId: criado.valor.id,
      quantidade: milesimos(1000),
      usuarioId,
      criadoEm: clock.agora(),
    });
    expect(baixa.ok).toBe(true);
    if (baixa.ok && baixa.valor.gravou) {
      expect(baixa.valor.saldoResultante).toBe(2000);
    }
    const movimento = sqlite
      .prepare(
        "SELECT tipo, quantidade_delta, quantidade_resultante FROM movimento_estoque WHERE tipo = 'baixa'",
      )
      .get() as { tipo: string; quantidade_delta: number; quantidade_resultante: number };
    expect(movimento).toEqual(
      expect.objectContaining({ tipo: 'baixa', quantidade_delta: -1000, quantidade_resultante: 2000 }),
    );
    const produto = sqlite
      .prepare('SELECT quantidade_atual, sync_status FROM produto WHERE id = ?')
      .get(criado.valor.id) as { quantidade_atual: number; sync_status: string };
    expect(produto.quantidade_atual).toBe(2000);
    expect(produto.sync_status).toBe('pendente');
  });

  it('rollback: falha na inserção do movimento deixa a quantidade intacta', async () => {
    const { repo, casaId, usuarioId, sqlite } = montar();
    const criado = await repo.criar(casaId, usuarioId, dadosValidos('Arroz', 3));
    if (!criado.ok) {
      throw new Error('setup');
    }
    // usuário inexistente → INSERT do movimento viola FK → transação inteira volta
    await expect(
      repo.darBaixa({
        produtoId: criado.valor.id,
        quantidade: milesimos(1000),
        usuarioId: 'usuario-fantasma',
        criadoEm: clock.agora(),
      }),
    ).rejects.toThrow(/FOREIGN KEY/i);
    const produto = sqlite
      .prepare('SELECT quantidade_atual FROM produto WHERE id = ?')
      .get(criado.valor.id) as { quantidade_atual: number };
    expect(produto.quantidade_atual).toBe(3000);
    expect(
      sqlite.prepare("SELECT COUNT(*) AS n FROM movimento_estoque WHERE tipo = 'baixa'").get(),
    ).toEqual({ n: 0 });
  });

  it('baixa maior que o saldo fixa em zero e a operação é bem-sucedida', async () => {
    const { repo, casaId, usuarioId, sqlite } = montar();
    const criado = await repo.criar(casaId, usuarioId, dadosValidos('Arroz', 0.5));
    if (!criado.ok) {
      throw new Error('setup');
    }
    const baixa = await repo.darBaixa({
      produtoId: criado.valor.id,
      quantidade: milesimos(2000),
      usuarioId,
      criadoEm: clock.agora(),
    });
    expect(baixa.ok).toBe(true);
    if (baixa.ok && baixa.valor.gravou) {
      expect(baixa.valor.saldoResultante).toBe(0);
    }
    const movimento = sqlite
      .prepare("SELECT quantidade_delta, quantidade_resultante FROM movimento_estoque WHERE tipo = 'baixa'")
      .get();
    expect(movimento).toEqual({ quantidade_delta: -500, quantidade_resultante: 0 });
  });

  it('baixa em produto zerado não grava movimento', async () => {
    const { repo, casaId, usuarioId, sqlite } = montar();
    const criado = await repo.criar(casaId, usuarioId, dadosValidos('Arroz', 0));
    if (!criado.ok) {
      throw new Error('setup');
    }
    const baixa = await repo.darBaixa({
      produtoId: criado.valor.id,
      quantidade: milesimos(1000),
      usuarioId,
      criadoEm: clock.agora(),
    });
    expect(baixa.ok).toBe(true);
    if (baixa.ok) {
      expect(baixa.valor.gravou).toBe(false);
    }
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM movimento_estoque').get()).toEqual({ n: 0 });
  });

  it('produto inexistente retorna nao_encontrado', async () => {
    const { repo, usuarioId } = montar();
    const baixa = await repo.darBaixa({
      produtoId: 'fantasma',
      quantidade: milesimos(1000),
      usuarioId,
      criadoEm: clock.agora(),
    });
    expect(baixa.ok).toBe(false);
  });
});

describe('ajustar — usuário informa o valor final', () => {
  it('ajuste para cima grava o valor final e o movimento com a variação positiva', async () => {
    const { repo, casaId, usuarioId, sqlite } = montar();
    const criado = await repo.criar(casaId, usuarioId, dadosValidos('Arroz', 2));
    if (!criado.ok) throw new Error('setup');

    const ajuste = await repo.ajustar({
      produtoId: criado.valor.id,
      valorFinal: milesimos(5000),
      usuarioId,
      motivo: null,
      criadoEm: clock.agora(),
    });
    expect(ajuste.ok).toBe(true);
    if (!ajuste.ok || !ajuste.valor.gravou) throw new Error('setup');
    expect(ajuste.valor.saldoResultante).toBe(5000);
    const movimento = sqlite
      .prepare(
        'SELECT tipo, quantidade_delta, quantidade_resultante, motivo FROM movimento_estoque WHERE id = ?',
      )
      .get(ajuste.valor.movimentoId);
    expect(movimento).toEqual({
      tipo: 'ajuste',
      quantidade_delta: 3000,
      quantidade_resultante: 5000,
      motivo: null,
    });
    const produto = sqlite
      .prepare('SELECT quantidade_atual FROM produto WHERE id = ?')
      .get(criado.valor.id) as { quantidade_atual: number };
    expect(produto.quantidade_atual).toBe(5000);
  });

  it('ajuste para baixo grava a variação negativa', async () => {
    const { repo, casaId, usuarioId, sqlite } = montar();
    const criado = await repo.criar(casaId, usuarioId, dadosValidos('Arroz', 5));
    if (!criado.ok) throw new Error('setup');

    const ajuste = await repo.ajustar({
      produtoId: criado.valor.id,
      valorFinal: milesimos(2000),
      usuarioId,
      motivo: null,
      criadoEm: clock.agora(),
    });
    if (!ajuste.ok || !ajuste.valor.gravou) throw new Error('setup');
    const movimento = sqlite
      .prepare(
        'SELECT quantidade_delta, quantidade_resultante FROM movimento_estoque WHERE id = ?',
      )
      .get(ajuste.valor.movimentoId);
    expect(movimento).toEqual({ quantidade_delta: -3000, quantidade_resultante: 2000 });
  });

  it('ajuste para zero grava a variação até zero', async () => {
    const { repo, casaId, usuarioId, sqlite } = montar();
    const criado = await repo.criar(casaId, usuarioId, dadosValidos('Arroz', 3));
    if (!criado.ok) throw new Error('setup');

    await repo.ajustar({
      produtoId: criado.valor.id,
      valorFinal: milesimos(0),
      usuarioId,
      motivo: null,
      criadoEm: clock.agora(),
    });
    const produto = sqlite
      .prepare('SELECT quantidade_atual FROM produto WHERE id = ?')
      .get(criado.valor.id) as { quantidade_atual: number };
    expect(produto.quantidade_atual).toBe(0);
  });

  it('valor final igual ao registrado não grava movimento', async () => {
    const { repo, casaId, usuarioId, sqlite } = montar();
    const criado = await repo.criar(casaId, usuarioId, dadosValidos('Arroz', 3));
    if (!criado.ok) throw new Error('setup');

    const ajuste = await repo.ajustar({
      produtoId: criado.valor.id,
      valorFinal: milesimos(3000),
      usuarioId,
      motivo: null,
      criadoEm: clock.agora(),
    });
    expect(ajuste.ok).toBe(true);
    if (ajuste.ok) {
      expect(ajuste.valor.gravou).toBe(false);
    }
    // `criar` com quantidade inicial 3 já grava um movimento de ajuste — o
    // teste confirma que NENHUM outro foi acrescentado por esta chamada.
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM movimento_estoque').get()).toEqual({ n: 1 });
  });

  it('motivo é registrado no movimento quando informado', async () => {
    const { repo, casaId, usuarioId, sqlite } = montar();
    const criado = await repo.criar(casaId, usuarioId, dadosValidos('Arroz', 3));
    if (!criado.ok) throw new Error('setup');

    const ajuste = await repo.ajustar({
      produtoId: criado.valor.id,
      valorFinal: milesimos(0),
      usuarioId,
      motivo: 'vencimento',
      criadoEm: clock.agora(),
    });
    if (!ajuste.ok || !ajuste.valor.gravou) throw new Error('setup');
    const movimento = sqlite
      .prepare('SELECT motivo FROM movimento_estoque WHERE id = ?')
      .get(ajuste.valor.movimentoId);
    expect(movimento).toEqual({ motivo: 'vencimento' });
  });

  it('produto inexistente retorna nao_encontrado', async () => {
    const { repo, usuarioId } = montar();
    const ajuste = await repo.ajustar({
      produtoId: 'fantasma',
      valorFinal: milesimos(1000),
      usuarioId,
      motivo: null,
      criadoEm: clock.agora(),
    });
    expect(ajuste.ok).toBe(false);
  });

  it('rollback: falha na inserção do movimento deixa a quantidade intacta', async () => {
    const { repo, casaId, usuarioId, sqlite } = montar();
    // quantidadeAtual inicial 0: sem isso, `criar` já grava um movimento de
    // ajuste de estoque inicial que a contagem abaixo teria de descontar.
    const criado = await repo.criar(casaId, usuarioId, dadosValidos('Arroz', 0));
    if (!criado.ok) throw new Error('setup');

    // usuário inexistente → INSERT do movimento viola FK → transação inteira volta
    await expect(
      repo.ajustar({
        produtoId: criado.valor.id,
        valorFinal: milesimos(5000),
        usuarioId: 'usuario-fantasma',
        motivo: null,
        criadoEm: clock.agora(),
      }),
    ).rejects.toThrow(/FOREIGN KEY/i);
    const produto = sqlite
      .prepare('SELECT quantidade_atual FROM produto WHERE id = ?')
      .get(criado.valor.id) as { quantidade_atual: number };
    expect(produto.quantidade_atual).toBe(0);
    expect(
      sqlite.prepare("SELECT COUNT(*) AS n FROM movimento_estoque WHERE tipo = 'ajuste'").get(),
    ).toEqual({ n: 0 });
  });
});

describe('listarTudoParaBackup', () => {
  it('inclui produtos inativos e removidos logicamente, ao contrário de listarDespensa', async () => {
    const { repo, casaId, usuarioId } = montar();
    const criado = await repo.criar(casaId, usuarioId, dadosValidos('Feijão'));
    if (!criado.ok) throw new Error('setup');
    await repo.removerLogicamente(criado.valor.id);

    const backup = await repo.listarTudoParaBackup(casaId);
    const despensa = await repo.listarDespensa(casaId);

    expect(backup.map((p) => p.id)).toContain(criado.valor.id);
    expect(despensa.map((p) => p.id)).not.toContain(criado.valor.id);
    expect(backup.find((p) => p.id === criado.valor.id)?.deletadoEm).not.toBeNull();
  });

  it('não retorna produtos de outra casa', async () => {
    const { repo, casaId, usuarioId, sqlite } = montar();
    await repo.criar(casaId, usuarioId, dadosValidos('Arroz'));
    sqlite
      .prepare('INSERT INTO casa (id, nome, criada_em, atualizado_em) VALUES (?, ?, 0, 0)')
      .run('outra-casa', 'Outra casa');
    const outros = await repo.listarTudoParaBackup('outra-casa');
    expect(outros).toHaveLength(0);
  });
});

describe('valorBrutoDoEstoque', () => {
  function dadosCom(nome: string, quantidadeAtual: number, valorUnitario: number) {
    const resultado = validarCadastroProduto({
      nome,
      unidade: 'un',
      quantidadeNecessaria: 1,
      quantidadeAtual,
      valorUnitario,
    });
    if (!resultado.ok) {
      throw new Error('fixture inválida');
    }
    return resultado.valor;
  }

  it('despensa conhecida: dois itens de valores dados produzem o bruto exato esperado', async () => {
    const { repo, casaId, usuarioId } = montar();
    await repo.criar(casaId, usuarioId, dadosCom('Arroz', 2, 1290));
    await repo.criar(casaId, usuarioId, dadosCom('Café', 3, 2250));

    const bruto = await repo.valorBrutoDoEstoque(casaId);

    expect(bruto).toBe(2000 * 1290 + 3000 * 2250);
    expect(converterValorBruto(bruto)).toBe(9330); // R$ 93,30
  });

  it('despensa vazia produz bruto zero', async () => {
    const { repo, casaId } = montar();
    expect(await repo.valorBrutoDoEstoque(casaId)).toBe(0);
  });

  it('produto sem preço contribui zero, sem invalidar o total dos demais', async () => {
    const { repo, casaId, usuarioId } = montar();
    await repo.criar(casaId, usuarioId, dadosCom('Arroz', 2, 1290));
    await repo.criar(casaId, usuarioId, dadosCom('Detergente', 1, 0));

    expect(await repo.valorBrutoDoEstoque(casaId)).toBe(2000 * 1290);
  });

  it('produto removido logicamente não entra no bruto', async () => {
    const { repo, casaId, usuarioId } = montar();
    await repo.criar(casaId, usuarioId, dadosCom('Arroz', 2, 1290));
    const removido = await repo.criar(casaId, usuarioId, dadosCom('Café', 3, 2250));
    if (!removido.ok) throw new Error('setup');
    await repo.removerLogicamente(removido.valor.id);

    expect(await repo.valorBrutoDoEstoque(casaId)).toBe(2000 * 1290);
  });

  it('produto inativo não entra no bruto', async () => {
    const { repo, casaId, usuarioId, sqlite } = montar();
    await repo.criar(casaId, usuarioId, dadosCom('Arroz', 2, 1290));
    const inativo = await repo.criar(casaId, usuarioId, dadosCom('Café', 3, 2250));
    if (!inativo.ok) throw new Error('setup');
    // Sem campo de edição de `ativo` na API pública — a coluna existe para
    // desativação futura, ainda sem caso de uso que a grave.
    sqlite.prepare('UPDATE produto SET ativo = 0 WHERE id = ?').run(inativo.valor.id);

    expect(await repo.valorBrutoDoEstoque(casaId)).toBe(2000 * 1290);
  });

  it('não soma o bruto de outra casa', async () => {
    const { repo, casaId, usuarioId, sqlite } = montar();
    await repo.criar(casaId, usuarioId, dadosCom('Arroz', 2, 1290));
    sqlite
      .prepare('INSERT INTO casa (id, nome, criada_em, atualizado_em) VALUES (?, ?, 0, 0)')
      .run('outra-casa', 'Outra casa');
    expect(await repo.valorBrutoDoEstoque('outra-casa')).toBe(0);
  });
});

describe('removerLogicamente — limpeza de compra_item pendente', () => {
  function contarComprasItem(sqlite: ReturnType<typeof criarDbDeTeste>['sqlite']): number {
    return (sqlite.prepare('SELECT COUNT(*) AS n FROM compra_item').get() as { n: number }).n;
  }

  it('prova do bug: item "fora da lista por agora" (excluido = true) some quando o produto é removido', async () => {
    const { repo, compras, casaId, usuarioId, sqlite } = montarComCompra();
    const produto = await repo.criar(casaId, usuarioId, dadosValidos('Arroz'));
    if (!produto.ok) throw new Error('setup');
    const compra = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!compra.ok) throw new Error('setup');
    const item = await compras.adicionarItem(compra.valor.id, {
      produtoId: produto.valor.id,
      unidade: 'pacote',
      quantidadePlanejada: milesimos(1000),
    });
    await compras.editarItem(item.id, { excluido: true });

    await repo.removerLogicamente(produto.valor.id);

    const linha = sqlite.prepare('SELECT id FROM compra_item WHERE id = ?').get(item.id);
    expect(linha).toBeUndefined();
  });

  // Item pendente comum (excluido=false) NÃO é apagado — só o registro
  // "fora da lista por agora" é o bug. A compra aberta continua precisando
  // dele pra não derrubar o próprio detalhe da compra (task 5.4/5.7 de
  // correcao-lista-de-compras, ver sqlite-compra.repository.test.ts).
  it('item pendente comum (comprado = false, excluido = false) permanece quando o produto é removido', async () => {
    const { repo, compras, casaId, usuarioId, sqlite } = montarComCompra();
    const produto = await repo.criar(casaId, usuarioId, dadosValidos('Arroz'));
    if (!produto.ok) throw new Error('setup');
    const compra = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!compra.ok) throw new Error('setup');
    const item = await compras.adicionarItem(compra.valor.id, {
      produtoId: produto.valor.id,
      unidade: 'pacote',
      quantidadePlanejada: milesimos(1000),
    });

    await repo.removerLogicamente(produto.valor.id);

    const linha = sqlite
      .prepare('SELECT produto_id AS produtoId FROM compra_item WHERE id = ?')
      .get(item.id) as { produtoId: string | null } | undefined;
    expect(linha).not.toBeUndefined();
    expect(linha?.produtoId).toBe(produto.valor.id);
  });

  // A remoção de produto é soft-delete (UPDATE deletado_em), nunca DELETE
  // físico — o FK onDelete:'set null' de compra_item.produto_id só dispara
  // em DELETE físico, que este fluxo nunca faz. Por isso o DELETE explícito
  // do compra_item cobre só excluido = true (design.md); item já comprado
  // não é tocado e continua apontando pro produto (agora soft-deletado).
  it('item já comprado em compra fechada permanece intacto, sem regredir o vínculo com o produto', async () => {
    const { repo, compras, casaId, usuarioId, sqlite } = montarComCompra();
    const produto = await repo.criar(casaId, usuarioId, dadosValidos('Arroz'));
    if (!produto.ok) throw new Error('setup');
    const compra = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!compra.ok) throw new Error('setup');
    const item = await compras.adicionarItem(compra.valor.id, {
      produtoId: produto.valor.id,
      unidade: 'pacote',
      quantidadePlanejada: milesimos(1000),
    });
    await compras.editarItem(item.id, {
      comprado: true,
      quantidadeComprada: milesimos(1000),
      valorPagoUnitario: centavos(890),
    });
    await compras.finalizar(
      compra.valor.id,
      { reposicoes: [], atualizacoesDePreco: [], totalPago: centavos(890) },
      usuarioId,
      clock.agora() + 1,
    );

    await repo.removerLogicamente(produto.valor.id);

    const linha = sqlite
      .prepare('SELECT produto_id AS produtoId FROM compra_item WHERE id = ?')
      .get(item.id) as { produtoId: string | null } | undefined;
    expect(linha).not.toBeUndefined();
    expect(linha?.produtoId).toBe(produto.valor.id);
  });

  it('produto sem nenhum item de compra associado: remoção não afeta compra_item de outros produtos', async () => {
    const { repo, compras, casaId, usuarioId, sqlite } = montarComCompra();
    const semItem = await repo.criar(casaId, usuarioId, dadosValidos('Arroz'));
    const comItem = await repo.criar(casaId, usuarioId, dadosValidos('Feijão'));
    if (!semItem.ok || !comItem.ok) throw new Error('setup');
    const compra = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!compra.ok) throw new Error('setup');
    const item = await compras.adicionarItem(compra.valor.id, {
      produtoId: comItem.valor.id,
      unidade: 'pacote',
      quantidadePlanejada: milesimos(1000),
    });

    await repo.removerLogicamente(semItem.valor.id);

    expect(contarComprasItem(sqlite)).toBe(1);
    const linha = sqlite.prepare('SELECT id FROM compra_item WHERE id = ?').get(item.id);
    expect(linha).not.toBeUndefined();
  });
});
