import { desc, eq, sql } from 'drizzle-orm';

import { MovimentoEstoque, TipoMovimento } from '../../domain/movimento/movimento';
import { movimentoInverso } from '../../domain/movimento/movimento.rules';
import { milesimos } from '../../domain/shared/quantidade';
import {
  DivergenciaReconciliacao,
  MovimentoRepository,
  ResultadoDesfazer,
} from '../../ports/movimento.repository';
import { gerarId } from '../../shared/id';
import { falha, Result, sucesso } from '../../shared/result';
import { movimentoEstoque, produto as tabelaProduto } from '../db/schema';
import { Db } from '../db/tipos';

type LinhaMovimento = typeof movimentoEstoque.$inferSelect;

function paraDominio(linha: LinhaMovimento): MovimentoEstoque {
  return {
    id: linha.id,
    casaId: linha.casaId,
    produtoId: linha.produtoId,
    usuarioId: linha.usuarioId,
    compraId: linha.compraId,
    tipo: linha.tipo as TipoMovimento,
    quantidadeDelta: milesimos(linha.quantidadeDelta),
    quantidadeResultante: milesimos(linha.quantidadeResultante),
    motivo: linha.motivo,
    criadoEm: linha.criadoEm,
    syncStatus: linha.syncStatus,
  };
}

export class SQLiteMovimentoRepository implements MovimentoRepository {
  constructor(private readonly db: Db) {}

  async historicoPorProduto(produtoId: string, limite = 50): Promise<MovimentoEstoque[]> {
    return this.db
      .select()
      .from(movimentoEstoque)
      .where(eq(movimentoEstoque.produtoId, produtoId))
      .orderBy(desc(movimentoEstoque.criadoEm))
      .limit(limite)
      .all()
      .map(paraDominio);
  }

  async historicoPorCasa(casaId: string, limite = 100): Promise<MovimentoEstoque[]> {
    return this.db
      .select()
      .from(movimentoEstoque)
      .where(eq(movimentoEstoque.casaId, casaId))
      .orderBy(desc(movimentoEstoque.criadoEm))
      .limit(limite)
      .all()
      .map(paraDominio);
  }

  // Desfazer: o original permanece na trilha; entra um NOVO movimento de
  // sinal oposto, e a quantidade do produto muda na MESMA transação.
  async desfazer(
    movimentoOriginalId: string,
    criadoEm: number,
  ): Promise<Result<ResultadoDesfazer, 'nao_encontrado'>> {
    return this.db.transaction((tx): Result<ResultadoDesfazer, 'nao_encontrado'> => {
      const original = tx
        .select()
        .from(movimentoEstoque)
        .where(eq(movimentoEstoque.id, movimentoOriginalId))
        .get();
      if (!original) {
        return falha('nao_encontrado');
      }

      const inverso = movimentoInverso({
        tipo: original.tipo as TipoMovimento,
        quantidadeDelta: milesimos(original.quantidadeDelta),
      });

      tx.update(tabelaProduto)
        .set({
          quantidadeAtual: sql`MAX(0, ${tabelaProduto.quantidadeAtual} + ${inverso.variacao})`,
          atualizadoEm: criadoEm,
          syncStatus: 'pendente',
        })
        .where(eq(tabelaProduto.id, original.produtoId))
        .run();

      const depois = tx
        .select({ quantidadeAtual: tabelaProduto.quantidadeAtual })
        .from(tabelaProduto)
        .where(eq(tabelaProduto.id, original.produtoId))
        .get() as { quantidadeAtual: number };

      const movimentoInversoId = gerarId(() => criadoEm);
      tx.insert(movimentoEstoque)
        .values({
          id: movimentoInversoId,
          casaId: original.casaId,
          produtoId: original.produtoId,
          usuarioId: original.usuarioId,
          tipo: inverso.tipo,
          quantidadeDelta: inverso.variacao,
          quantidadeResultante: depois.quantidadeAtual,
          motivo: 'desfazer',
          criadoEm,
        })
        .run();

      return sucesso({
        movimentoInversoId,
        saldoResultante: milesimos(depois.quantidadeAtual),
      });
    });
  }

  // DATABASE §6.6 — deve retornar zero linhas sempre.
  async reconciliar(casaId: string): Promise<DivergenciaReconciliacao[]> {
    const linhas = this.db.all<{
      produtoId: string;
      nome: string;
      materializado: number;
      calculado: number;
    }>(sql`
      SELECT p.id AS produtoId, p.nome AS nome,
             p.quantidade_atual AS materializado,
             COALESCE(SUM(m.quantidade_delta), 0) AS calculado
      FROM produto p
      LEFT JOIN movimento_estoque m ON m.produto_id = p.id
      WHERE p.casa_id = ${casaId} AND p.deletado_em IS NULL
      GROUP BY p.id
      HAVING materializado <> calculado
    `);
    return linhas.map((linha) => ({
      produtoId: linha.produtoId,
      nome: linha.nome,
      materializado: milesimos(linha.materializado),
      calculado: milesimos(linha.calculado),
    }));
  }
}
