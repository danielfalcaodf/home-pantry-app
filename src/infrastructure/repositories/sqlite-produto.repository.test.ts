import { validarCadastroProduto } from '../../domain/produto/validacao';
import { milesimos } from '../../domain/shared/quantidade';
import { criarDbDeTeste, semearCasaEUsuario } from '../db/teste/criar-db-teste';
import { SQLiteProdutoRepository } from './sqlite-produto.repository';

const clock = { agora: () => 1_700_000_000_000 };

function montar() {
  const { db, sqlite } = criarDbDeTeste();
  const { casaId, usuarioId } = semearCasaEUsuario(sqlite);
  const repo = new SQLiteProdutoRepository(db, clock);
  return { repo, sqlite, casaId, usuarioId };
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
