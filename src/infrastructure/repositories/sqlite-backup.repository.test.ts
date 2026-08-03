import { efeitosDaFinalizacao } from '../../domain/compra/compra.rules';
import { validarCadastroProduto } from '../../domain/produto/validacao';
import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { VERSAO_SCHEMA_BACKUP_ATUAL } from '../../domain/backup/backup.schema';
import { criarDbDeTeste, semearCasaEUsuario } from '../db/teste/criar-db-teste';
import { SQLiteBackupRepository } from './sqlite-backup.repository';
import { SQLiteCompraRepository } from './sqlite-compra.repository';
import { SQLiteMovimentoRepository } from './sqlite-movimento.repository';
import { SQLiteProdutoRepository } from './sqlite-produto.repository';

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
