import { and, eq, sql } from 'drizzle-orm';

import { Compra, CompraItem, StatusCompra } from '../../domain/compra/compra';
import { EfeitosFinalizacao } from '../../domain/compra/compra.rules';
import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { Unidade } from '../../domain/shared/unidade';
import {
  CompraRepository,
  EdicaoItemCompra,
  ItemComProduto,
  NovoItemCompra,
} from '../../ports/compra.repository';
import { gerarId } from '../../shared/id';
import { falha, Result, sucesso } from '../../shared/result';
import {
  compra as tabelaCompra,
  compraItem as tabelaCompraItem,
  movimentoEstoque,
  produto as tabelaProduto,
} from '../db/schema';
import { Db } from '../db/tipos';

type LinhaCompra = typeof tabelaCompra.$inferSelect;
type LinhaItem = typeof tabelaCompraItem.$inferSelect;

function compraParaDominio(linha: LinhaCompra): Compra {
  return {
    id: linha.id,
    casaId: linha.casaId,
    usuarioId: linha.usuarioId,
    status: linha.status as StatusCompra,
    valorTotalPago: linha.valorTotalPago === null ? null : centavos(linha.valorTotalPago),
    criadaEm: linha.criadaEm,
    finalizadaEm: linha.finalizadaEm,
    atualizadoEm: linha.atualizadoEm,
    syncStatus: linha.syncStatus as Compra['syncStatus'],
  };
}

function itemParaDominio(linha: LinhaItem): CompraItem {
  return {
    id: linha.id,
    compraId: linha.compraId,
    produtoId: linha.produtoId,
    nomeAvulso: linha.nomeAvulso,
    unidade: linha.unidade as Unidade,
    quantidadePlanejada: milesimos(linha.quantidadePlanejada),
    quantidadeComprada:
      linha.quantidadeComprada === null ? null : milesimos(linha.quantidadeComprada),
    valorEstimadoUnit: centavos(linha.valorEstimadoUnit),
    valorPagoUnitario:
      linha.valorPagoUnitario === null ? null : centavos(linha.valorPagoUnitario),
    comprado: linha.comprado,
    ordem: linha.ordem,
    excluido: linha.excluido,
    atualizarPreco: linha.atualizarPreco,
  };
}

export class SQLiteCompraRepository implements CompraRepository {
  constructor(private readonly db: Db) {}

  async abrir(
    casaId: string,
    usuarioId: string,
    criadaEm: number,
  ): Promise<Result<Compra, 'ja_existe_aberta'>> {
    const id = gerarId(() => criadaEm);
    try {
      this.db
        .insert(tabelaCompra)
        .values({ id, casaId, usuarioId, criadaEm, atualizadoEm: criadaEm })
        .run();
    } catch (erro) {
      const mensagem = (erro as { message?: unknown } | null)?.message;
      if (typeof mensagem === 'string' && /UNIQUE/i.test(mensagem)) {
        return falha('ja_existe_aberta');
      }
      throw erro;
    }
    const linha = this.db
      .select()
      .from(tabelaCompra)
      .where(eq(tabelaCompra.id, id))
      .get() as LinhaCompra;
    return sucesso(compraParaDominio(linha));
  }

  async obterAberta(casaId: string): Promise<Compra | null> {
    const linha = this.db
      .select()
      .from(tabelaCompra)
      .where(and(eq(tabelaCompra.casaId, casaId), eq(tabelaCompra.status, 'aberta')))
      .get();
    return linha ? compraParaDominio(linha) : null;
  }

  async adicionarItem(compraId: string, item: NovoItemCompra): Promise<CompraItem> {
    const id = gerarId();
    const ordem =
      item.ordem ??
      ((this.db
        .select({ maxOrdem: sql<number>`COALESCE(MAX(${tabelaCompraItem.ordem}), -1)` })
        .from(tabelaCompraItem)
        .where(eq(tabelaCompraItem.compraId, compraId))
        .get()?.maxOrdem ?? -1) + 1);
    this.db
      .insert(tabelaCompraItem)
      .values({
        id,
        compraId,
        produtoId: item.produtoId ?? null,
        nomeAvulso: item.nomeAvulso ?? null,
        unidade: item.unidade,
        quantidadePlanejada: item.quantidadePlanejada,
        valorEstimadoUnit: item.valorEstimadoUnit ?? 0,
        ordem,
        excluido: item.excluido ?? false,
      })
      .run();
    const linha = this.db
      .select()
      .from(tabelaCompraItem)
      .where(eq(tabelaCompraItem.id, id))
      .get() as LinhaItem;
    return itemParaDominio(linha);
  }

  async editarItem(itemId: string, dados: EdicaoItemCompra): Promise<void> {
    this.db
      .update(tabelaCompraItem)
      .set({
        ...(dados.nomeAvulso !== undefined && { nomeAvulso: dados.nomeAvulso }),
        ...(dados.unidade !== undefined && { unidade: dados.unidade }),
        ...(dados.quantidadePlanejada !== undefined && {
          quantidadePlanejada: dados.quantidadePlanejada,
        }),
        ...(dados.valorEstimadoUnit !== undefined && {
          valorEstimadoUnit: dados.valorEstimadoUnit,
        }),
        ...(dados.quantidadeComprada !== undefined && {
          quantidadeComprada: dados.quantidadeComprada,
        }),
        ...(dados.valorPagoUnitario !== undefined && {
          valorPagoUnitario: dados.valorPagoUnitario,
        }),
        ...(dados.comprado !== undefined && { comprado: dados.comprado }),
        ...(dados.ordem !== undefined && { ordem: dados.ordem }),
        ...(dados.atualizarPreco !== undefined && { atualizarPreco: dados.atualizarPreco }),
      })
      .where(eq(tabelaCompraItem.id, itemId))
      .run();
  }

  async removerItem(itemId: string): Promise<void> {
    this.db.delete(tabelaCompraItem).where(eq(tabelaCompraItem.id, itemId)).run();
  }

  // Uma única consulta com junção EXTERNA: item avulso tem produto NULL e
  // sumiria com inner join (DATABASE §6.7).
  async listarItens(compraId: string): Promise<ItemComProduto[]> {
    const linhas = this.db
      .select({
        item: tabelaCompraItem,
        produtoId: tabelaProduto.id,
        produtoNome: tabelaProduto.nome,
        produtoCategoria: tabelaProduto.categoria,
        produtoUnidade: tabelaProduto.unidade,
        produtoValorUnitario: tabelaProduto.valorUnitario,
      })
      .from(tabelaCompraItem)
      .leftJoin(tabelaProduto, eq(tabelaCompraItem.produtoId, tabelaProduto.id))
      .where(eq(tabelaCompraItem.compraId, compraId))
      .orderBy(tabelaCompraItem.ordem)
      .all();
    return linhas.map((linha) => ({
      item: itemParaDominio(linha.item),
      produto:
        linha.produtoId === null
          ? null
          : {
              id: linha.produtoId,
              nome: linha.produtoNome as string,
              categoria: linha.produtoCategoria,
              unidade: linha.produtoUnidade as Unidade,
              valorUnitario: centavos(linha.produtoValorUnitario as number),
            },
    }));
  }

  // Ou a compra inteira repõe, ou nada repõe (DATABASE §6.4): loop de itens
  // dentro de UMA transação, movimento lendo o saldo do banco após o UPDATE.
  async finalizar(
    compraId: string,
    efeitos: EfeitosFinalizacao,
    usuarioId: string,
    finalizadaEm: number,
  ): Promise<Result<Compra, 'nao_encontrada' | 'nao_esta_aberta'>> {
    return this.db.transaction(
      (tx): Result<Compra, 'nao_encontrada' | 'nao_esta_aberta'> => {
        const compra = tx
          .select()
          .from(tabelaCompra)
          .where(eq(tabelaCompra.id, compraId))
          .get();
        if (!compra) {
          return falha('nao_encontrada');
        }
        if (compra.status !== 'aberta') {
          return falha('nao_esta_aberta');
        }

        for (const reposicao of efeitos.reposicoes) {
          tx.update(tabelaProduto)
            .set({
              quantidadeAtual: sql`${tabelaProduto.quantidadeAtual} + ${reposicao.movimento.variacao}`,
              atualizadoEm: finalizadaEm,
              syncStatus: 'pendente',
            })
            .where(eq(tabelaProduto.id, reposicao.produtoId))
            .run();

          const depois = tx
            .select({
              casaId: tabelaProduto.casaId,
              quantidadeAtual: tabelaProduto.quantidadeAtual,
            })
            .from(tabelaProduto)
            .where(eq(tabelaProduto.id, reposicao.produtoId))
            .get();
          if (!depois) {
            // Produto referenciado não existe: aborta a transação inteira.
            throw new Error(`produto ${reposicao.produtoId} não encontrado na finalização`);
          }

          tx.insert(movimentoEstoque)
            .values({
              id: gerarId(() => finalizadaEm),
              casaId: depois.casaId,
              produtoId: reposicao.produtoId,
              usuarioId,
              compraId,
              tipo: 'reposicao',
              quantidadeDelta: reposicao.movimento.variacao,
              quantidadeResultante: depois.quantidadeAtual,
              criadoEm: finalizadaEm,
            })
            .run();
        }

        for (const atualizacao of efeitos.atualizacoesDePreco) {
          tx.update(tabelaProduto)
            .set({
              valorUnitario: atualizacao.novoValorUnitario,
              atualizadoEm: finalizadaEm,
              syncStatus: 'pendente',
            })
            .where(eq(tabelaProduto.id, atualizacao.produtoId))
            .run();
        }

        tx.update(tabelaCompra)
          .set({
            status: 'finalizada',
            finalizadaEm,
            valorTotalPago: efeitos.totalPago,
            atualizadoEm: finalizadaEm,
            syncStatus: 'pendente',
          })
          .where(eq(tabelaCompra.id, compraId))
          .run();

        const finalizada = tx
          .select()
          .from(tabelaCompra)
          .where(eq(tabelaCompra.id, compraId))
          .get() as LinhaCompra;
        return sucesso(compraParaDominio(finalizada));
      },
    );
  }
}
