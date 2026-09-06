import { ArquivoBackup, VERSAO_SCHEMA_BACKUP_ATUAL } from '../../domain/backup/backup.schema';
import { efeitosDaFinalizacao } from '../../domain/compra/compra.rules';
import { validarCadastroProduto } from '../../domain/produto/validacao';
import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { criarDbDeTeste, semearCasaEUsuario } from '../db/teste/criar-db-teste';
import { SQLiteBackupRepository } from './sqlite-backup.repository';
import { SQLiteCompraRepository } from './sqlite-compra.repository';
import { SQLiteMovimentoRepository } from './sqlite-movimento.repository';
import { SQLiteProdutoRepository } from './sqlite-produto.repository';

function arquivoDeOutroAparelho(sobrescreve: Partial<ArquivoBackup> = {}): ArquivoBackup {
  return {
    versaoSchema: VERSAO_SCHEMA_BACKUP_ATUAL,
    exportadoEm: 500,
    casa: { id: 'casa-do-backup', nome: 'Casa restaurada', criadaEm: 0, atualizadoEm: 0 },
    usuarios: [
      {
        id: 'usuario-do-backup',
        casaId: 'casa-do-backup',
        nome: 'Quem fez o backup',
        perfil: 'admin',
        criadoEm: 0,
        atualizadoEm: 0,
      },
    ],
    produtos: [
      {
        id: 'produto-do-backup',
        casaId: 'casa-do-backup',
        nome: 'Arroz',
        categoria: 'Grãos',
        unidade: 'pacote',
        quantidadeAtual: milesimos(2000),
        quantidadeNecessaria: milesimos(3000),
        valorUnitario: centavos(890),
        marcaPreferida: null,
        observacao: null,
        fatorConversaoEmbalagem: null,
        valorReferenciaEmbalagem: null,
        ativo: true,
        criadoEm: 100,
        atualizadoEm: 100,
        deletadoEm: null,
        syncStatus: 'sincronizado',
      },
    ],
    movimentos: [
      {
        id: 'movimento-do-backup',
        casaId: 'casa-do-backup',
        produtoId: 'produto-do-backup',
        usuarioId: 'usuario-do-backup',
        compraId: null,
        tipo: 'ajuste',
        quantidadeDelta: milesimos(2000),
        quantidadeResultante: milesimos(2000),
        motivo: 'estoque_inicial',
        criadoEm: 100,
        syncStatus: 'sincronizado',
      },
    ],
    compras: [],
    itensCompra: [],
    ...sobrescreve,
  };
}

const clock = { agora: () => 1_700_000_000_000 };

async function montar() {
  const { db, sqlite } = criarDbDeTeste();
  const { casaId, usuarioId } = semearCasaEUsuario(sqlite);
  const produtos = new SQLiteProdutoRepository(db, clock);
  const movimentos = new SQLiteMovimentoRepository(db);
  const compras = new SQLiteCompraRepository(db);
  const backup = new SQLiteBackupRepository(db, produtos, movimentos, compras);
  return { db, sqlite, casaId, usuarioId, produtos, movimentos, compras, backup };
}

describe('SQLiteBackupRepository.montar', () => {
  it('lança quando a casa não existe', async () => {
    const { backup } = await montar();
    await expect(backup.montar('casa-fantasma', clock.agora())).rejects.toThrow();
  });

  it('inclui a versão de schema e a data de exportação', async () => {
    const { backup, casaId } = await montar();
    const arquivo = await backup.montar(casaId, 12345);
    expect(arquivo.versaoSchema).toBe(VERSAO_SCHEMA_BACKUP_ATUAL);
    expect(arquivo.exportadoEm).toBe(12345);
  });

  it('inclui casa e usuário', async () => {
    const { backup, casaId, usuarioId } = await montar();
    const arquivo = await backup.montar(casaId, clock.agora());
    expect(arquivo.casa.id).toBe(casaId);
    expect(arquivo.usuarios.map((u) => u.id)).toEqual([usuarioId]);
  });

  it('inclui produtos removidos logicamente, com a marcação de remoção', async () => {
    const { backup, produtos, casaId, usuarioId } = await montar();
    const dados = validarCadastroProduto({ nome: 'Feijão', unidade: 'un', quantidadeNecessaria: 2 });
    if (!dados.ok) throw new Error('setup');
    const criado = await produtos.criar(casaId, usuarioId, dados.valor);
    if (!criado.ok) throw new Error('setup');
    await produtos.removerLogicamente(criado.valor.id);

    const arquivo = await backup.montar(casaId, clock.agora());
    const removido = arquivo.produtos.find((p) => p.id === criado.valor.id);
    expect(removido).toBeDefined();
    expect(removido?.deletadoEm).not.toBeNull();
  });

  it('inclui todo o histórico de movimentos, sem truncamento', async () => {
    const { backup, produtos, casaId, usuarioId } = await montar();
    const dados = validarCadastroProduto({
      nome: 'Arroz',
      unidade: 'pacote',
      quantidadeNecessaria: 3,
      quantidadeAtual: 5,
    });
    if (!dados.ok) throw new Error('setup');
    const criado = await produtos.criar(casaId, usuarioId, dados.valor);
    if (!criado.ok) throw new Error('setup');
    await produtos.darBaixa({
      produtoId: criado.valor.id,
      quantidade: milesimos(1000),
      usuarioId,
      criadoEm: clock.agora(),
    });

    const arquivo = await backup.montar(casaId, clock.agora());
    // ajuste do estoque inicial + baixa
    expect(arquivo.movimentos).toHaveLength(2);
  });

  it('inclui compras finalizadas, canceladas e a compra aberta, com seus itens', async () => {
    const { backup, produtos, compras, casaId, usuarioId } = await montar();
    const dados = validarCadastroProduto({
      nome: 'Café',
      unidade: 'pacote',
      quantidadeNecessaria: 3,
      valorUnitario: 1200,
    });
    if (!dados.ok) throw new Error('setup');
    const produto = await produtos.criar(casaId, usuarioId, dados.valor);
    if (!produto.ok) throw new Error('setup');

    const cancelada = await compras.abrir(casaId, usuarioId, clock.agora());
    if (!cancelada.ok) throw new Error('setup');
    await compras.adicionarItem(cancelada.valor.id, {
      produtoId: produto.valor.id,
      unidade: 'pacote',
      quantidadePlanejada: milesimos(3000),
      valorEstimadoUnit: centavos(1200),
    });
    await compras.cancelar(cancelada.valor.id, clock.agora() + 1);

    const finalizada = await compras.abrir(casaId, usuarioId, clock.agora() + 2);
    if (!finalizada.ok) throw new Error('setup');
    await compras.adicionarItem(finalizada.valor.id, {
      produtoId: produto.valor.id,
      unidade: 'pacote',
      quantidadePlanejada: milesimos(3000),
      valorEstimadoUnit: centavos(1200),
    });
    const itens = (await compras.listarItens(finalizada.valor.id)).map((i) => i.item);
    const produtosAtuais = await produtos.listarDespensa(casaId);
    const efeitos = efeitosDaFinalizacao(itens, produtosAtuais, new Set());
    if (!efeitos.ok) throw new Error('setup');
    await compras.finalizar(finalizada.valor.id, efeitos.valor, usuarioId, clock.agora() + 3);

    const aberta = await compras.abrir(casaId, usuarioId, clock.agora() + 4);
    if (!aberta.ok) throw new Error('setup');

    const arquivo = await backup.montar(casaId, clock.agora() + 5);
    expect(arquivo.compras.map((c) => c.status).sort()).toEqual([
      'aberta',
      'cancelada',
      'finalizada',
    ]);
    expect(arquivo.itensCompra.filter((i) => i.compraId === cancelada.valor.id)).toHaveLength(1);
    expect(arquivo.itensCompra.filter((i) => i.compraId === finalizada.valor.id)).toHaveLength(1);
  });

  it('não inclui dados de outra casa', async () => {
    const { backup, sqlite } = await montar();
    sqlite
      .prepare('INSERT INTO casa (id, nome, criada_em, atualizado_em) VALUES (?, ?, 0, 0)')
      .run('outra-casa', 'Outra casa');
    sqlite
      .prepare(
        "INSERT INTO usuario (id, casa_id, nome, perfil, criado_em, atualizado_em) VALUES ('outro-usuario', 'outra-casa', 'Outro', 'admin', 0, 0)",
      )
      .run();
    const arquivo = await backup.montar('outra-casa', clock.agora());
    expect(arquivo.produtos).toHaveLength(0);
    expect(arquivo.usuarios.map((u) => u.id)).toEqual(['outro-usuario']);
  });
});

describe('SQLiteBackupRepository.restaurar', () => {
  it('insere tudo sob a casa local, reescrevendo o casaId (design D8)', async () => {
    const { backup, casaId, sqlite } = await montar();
    const arquivo = arquivoDeOutroAparelho();

    await backup.restaurar(arquivo, casaId, 999);

    const produto = sqlite
      .prepare('SELECT casa_id, nome FROM produto WHERE id = ?')
      .get('produto-do-backup') as { casa_id: string; nome: string };
    expect(produto.casa_id).toBe(casaId);
    expect(produto.nome).toBe('Arroz');

    const movimento = sqlite
      .prepare('SELECT casa_id FROM movimento_estoque WHERE id = ?')
      .get('movimento-do-backup') as { casa_id: string };
    expect(movimento.casa_id).toBe(casaId);

    const usuario = sqlite
      .prepare('SELECT casa_id FROM usuario WHERE id = ?')
      .get('usuario-do-backup') as { casa_id: string };
    expect(usuario.casa_id).toBe(casaId);
  });

  it('nunca insere uma segunda casa — atualiza o nome da casa local', async () => {
    const { backup, casaId, sqlite } = await montar();
    await backup.restaurar(arquivoDeOutroAparelho(), casaId, 999);

    const casas = sqlite.prepare('SELECT id, nome FROM casa').all() as {
      id: string;
      nome: string;
    }[];
    expect(casas).toHaveLength(1);
    expect(casas[0]).toEqual({ id: casaId, nome: 'Casa restaurada' });
  });

  it('registro ausente é inserido; registro existente é atualizado com o conteúdo do backup', async () => {
    const { backup, produtos, casaId, usuarioId, sqlite } = await montar();
    const dados = validarCadastroProduto({ nome: 'Feijão', unidade: 'un', quantidadeNecessaria: 2 });
    if (!dados.ok) throw new Error('setup');
    const existente = await produtos.criar(casaId, usuarioId, dados.valor);
    if (!existente.ok) throw new Error('setup');

    const arquivo = arquivoDeOutroAparelho({
      produtos: [
        {
          id: existente.valor.id,
          casaId: 'casa-do-backup',
          nome: 'Feijão preto',
          categoria: 'Grãos',
          unidade: 'un',
          quantidadeAtual: milesimos(0),
          quantidadeNecessaria: milesimos(2000),
          valorUnitario: centavos(0),
          marcaPreferida: null,
          observacao: null,
          fatorConversaoEmbalagem: null,
          valorReferenciaEmbalagem: null,
          ativo: true,
          criadoEm: 0,
          atualizadoEm: 0,
          deletadoEm: null,
          syncStatus: 'sincronizado',
        },
      ],
      // O movimento padrão da fixture referencia produto-do-backup, que não
      // está mais na lista de produtos deste arquivo — sem isso, a FK falha.
      movimentos: [],
    });
    await backup.restaurar(arquivo, casaId, 999);

    const linha = sqlite
      .prepare('SELECT nome, casa_id FROM produto WHERE id = ?')
      .get(existente.valor.id) as { nome: string; casa_id: string };
    expect(linha.nome).toBe('Feijão preto');
    expect(linha.casa_id).toBe(casaId);
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM produto').get()).toEqual({ n: 1 });
  });

  it('restauração repetida é idempotente — mesmo arquivo duas vezes não duplica nada', async () => {
    const { backup, casaId, sqlite } = await montar();
    const arquivo = arquivoDeOutroAparelho();

    await backup.restaurar(arquivo, casaId, 999);
    await backup.restaurar(arquivo, casaId, 1000);

    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM produto').get()).toEqual({ n: 1 });
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM movimento_estoque').get()).toEqual({ n: 1 });
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM usuario').get()).toEqual({ n: 2 });
  });

  it('combina com dados criados no aparelho depois do backup, sem apagar nenhum', async () => {
    const { backup, produtos, casaId, usuarioId, sqlite } = await montar();
    const dados = validarCadastroProduto({ nome: 'Macarrão', unidade: 'pacote', quantidadeNecessaria: 2 });
    if (!dados.ok) throw new Error('setup');
    const criadoLocalmente = await produtos.criar(casaId, usuarioId, dados.valor);
    if (!criadoLocalmente.ok) throw new Error('setup');

    await backup.restaurar(arquivoDeOutroAparelho(), casaId, 999);

    const nomes = sqlite.prepare('SELECT nome FROM produto ORDER BY nome').all() as {
      nome: string;
    }[];
    expect(nomes.map((n) => n.nome)).toEqual(['Arroz', 'Macarrão']);
  });

  it('falha no meio da transação não deixa estado parcial', async () => {
    const { backup, casaId, sqlite } = await montar();
    const antesProdutos = sqlite.prepare('SELECT COUNT(*) AS n FROM produto').get();
    const antesItens = sqlite.prepare('SELECT COUNT(*) AS n FROM compra_item').get();

    // item de compra referenciando uma compra inexistente: viola FK depois
    // de já ter inserido produtos e movimentos válidos — a transação
    // inteira precisa desfazer também essas escritas anteriores.
    const arquivo = arquivoDeOutroAparelho({
      itensCompra: [
        {
          id: 'item-orfao',
          compraId: 'compra-que-nao-existe',
          produtoId: 'produto-do-backup',
          nomeAvulso: null,
          unidade: 'pacote',
          quantidadePlanejada: milesimos(1000),
          quantidadeComprada: null,
          valorEstimadoUnit: centavos(0),
          valorPagoUnitario: null,
          quantidadePacotes: null,
          fatorUsadoNaCompra: null,
          comprado: false,
          ordem: 0,
          excluido: false,
          atualizarPreco: null,
        },
      ],
    });

    await expect(backup.restaurar(arquivo, casaId, 999)).rejects.toThrow(/FOREIGN KEY/i);

    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM produto').get()).toEqual(antesProdutos);
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM compra_item').get()).toEqual(antesItens);
  });

  it('duas compras abertas com ids diferentes (local e do backup) rejeitam a transação inteira', async () => {
    const { backup, compras, casaId, usuarioId, sqlite } = await montar();
    const abertaLocal = await compras.abrir(casaId, usuarioId, 10);
    if (!abertaLocal.ok) throw new Error('setup');

    const arquivo = arquivoDeOutroAparelho({
      compras: [
        {
          id: 'compra-aberta-do-backup',
          casaId: 'casa-do-backup',
          usuarioId: 'usuario-do-backup',
          status: 'aberta',
          valorTotalPago: null,
          criadaEm: 5,
          finalizadaEm: null,
          atualizadoEm: 5,
          syncStatus: 'sincronizado',
        },
      ],
    });

    await expect(backup.restaurar(arquivo, casaId, 999)).rejects.toThrow(/UNIQUE/i);
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM compra').get()).toEqual({ n: 1 });
  });
});

describe('reconciliação após restaurar (tasks 4.6-4.7)', () => {
  it('backup íntegro restaurado não deixa nenhuma divergência', async () => {
    const { backup, movimentos, casaId } = await montar();
    // produto-do-backup: quantidadeAtual 2000, movimento único de +2000 —
    // coerente por construção.
    await backup.restaurar(arquivoDeOutroAparelho(), casaId, 999);

    expect(await movimentos.reconciliar(casaId)).toHaveLength(0);
  });

  it('backup adulterado (quantidade não bate com a soma dos movimentos) é detectado após restaurar', async () => {
    const { backup, movimentos, casaId } = await montar();
    const arquivo = arquivoDeOutroAparelho({
      produtos: [
        {
          id: 'produto-do-backup',
          casaId: 'casa-do-backup',
          nome: 'Arroz',
          categoria: 'Grãos',
          unidade: 'pacote',
          // adulterado: o arquivo diz 5000, mas o único movimento abaixo soma 2000.
          quantidadeAtual: milesimos(5000),
          quantidadeNecessaria: milesimos(3000),
          valorUnitario: centavos(890),
          marcaPreferida: null,
          observacao: null,
          fatorConversaoEmbalagem: null,
          valorReferenciaEmbalagem: null,
          ativo: true,
          criadoEm: 100,
          atualizadoEm: 100,
          deletadoEm: null,
          syncStatus: 'sincronizado',
        },
      ],
    });

    await backup.restaurar(arquivo, casaId, 999);

    const divergencias = await movimentos.reconciliar(casaId);
    expect(divergencias).toHaveLength(1);
    expect(divergencias[0]).toEqual(
      expect.objectContaining({ produtoId: 'produto-do-backup', materializado: 5000, calculado: 2000 }),
    );
  });
});
