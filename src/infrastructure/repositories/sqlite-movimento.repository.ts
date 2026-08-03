import { desc, eq, sql } from 'drizzle-orm';

import { MovimentoEstoque, TipoMovimento } from '../../domain/movimento/movimento';
import { movimentoInverso } from '../../domain/movimento/movimento.rules';
import { Milesimos, milesimos } from '../../domain/shared/quantidade';
import {
  DivergenciaReconciliacao,
  MovimentoRepository,
  ResultadoAjuste,
  ResultadoCorrecaoEmBloco,
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

  // DATABASE §6.6 — deve retornar zero linhas sempre. Movimentos de ajuste
  // motivo='reconciliacao' ficam FORA da soma (design D9 da change
  // backup-restore-json): eles registram a própria correção, não uma causa
  // dela — contá-los tornaria toda correção auto-inconsistente (o novo
  // delta mudaria a soma que acabou de ser usada como alvo, e nenhuma
  // correção jamais convergiria).
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
      LEFT JOIN movimento_estoque m
        ON m.produto_id = p.id AND (m.motivo IS NULL OR m.motivo <> 'reconciliacao')
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

  // Mesma forma da baixa/reposição: UPDATE lendo o saldo do banco depois +
  // INSERT do movimento na MESMA transação. Nunca ajusta em silêncio — a
  // correção é sempre um movimento novo, append-only (design D4).
  async corrigirDivergencia(
    produtoId: string,
    usuarioId: string,
    calculado: Milesimos,
    criadoEm: number,
  ): Promise<Result<ResultadoAjuste, 'nao_encontrado'>> {
    return this.db.transaction((tx): Result<ResultadoAjuste, 'nao_encontrado'> => {
      const atual = tx
        .select({ casaId: tabelaProduto.casaId, quantidadeAtual: tabelaProduto.quantidadeAtual })
        .from(tabelaProduto)
        .where(eq(tabelaProduto.id, produtoId))
        .get();
      if (!atual) {
        return falha('nao_encontrado');
      }

      tx.update(tabelaProduto)
        .set({ quantidadeAtual: calculado, atualizadoEm: criadoEm, syncStatus: 'pendente' })
        .where(eq(tabelaProduto.id, produtoId))
        .run();

      const movimentoId = gerarId(() => criadoEm);
      tx.insert(movimentoEstoque)
        .values({
          id: movimentoId,
          casaId: atual.casaId,
          produtoId,
          usuarioId,
          tipo: 'ajuste',
          quantidadeDelta: calculado - atual.quantidadeAtual,
          quantidadeResultante: calculado,
          motivo: 'reconciliacao',
          criadoEm,
        })
        .run();

      return sucesso({ movimentoId, saldoResultante: milesimos(calculado) });
    });
  }

  // Mesma consulta de reconciliar(), mas dentro da transação de correção —
  // uma falha no meio do lote (ex.: FK inválida) reverte tudo, sem deixar
  // metade dos produtos corrigidos (task 4.11).
  async corrigirTodasDivergencias(
    casaId: string,
    usuarioId: string,
    criadoEm: number,
  ): Promise<ResultadoCorrecaoEmBloco> {
    return this.db.transaction((tx): ResultadoCorrecaoEmBloco => {
      const divergentes = tx.all<{
        produtoId: string;
        materializado: number;
        calculado: number;
      }>(sql`
        SELECT p.id AS produtoId,
               p.quantidade_atual AS materializado,
               COALESCE(SUM(m.quantidade_delta), 0) AS calculado
        FROM produto p
        LEFT JOIN movimento_estoque m
          ON m.produto_id = p.id AND (m.motivo IS NULL OR m.motivo <> 'reconciliacao')
        WHERE p.casa_id = ${casaId} AND p.deletado_em IS NULL
        GROUP BY p.id
        HAVING materializado <> calculado
      `);

      for (const divergencia of divergentes) {
        tx.update(tabelaProduto)
          .set({
            quantidadeAtual: divergencia.calculado,
            atualizadoEm: criadoEm,
            syncStatus: 'pendente',
          })
          .where(eq(tabelaProduto.id, divergencia.produtoId))
          .run();

        tx.insert(movimentoEstoque)
          .values({
            id: gerarId(() => criadoEm),
            casaId,
            produtoId: divergencia.produtoId,
            usuarioId,
            tipo: 'ajuste',
            quantidadeDelta: divergencia.calculado - divergencia.materializado,
            quantidadeResultante: divergencia.calculado,
            motivo: 'reconciliacao',
            criadoEm,
          })
          .run();
      }

      return { corrigidos: divergentes.length };
    });
  }

  // Sem limite: o backup precisa do histórico inteiro, sem truncamento por
  // data (proposal.md, "Backup completo").
  async listarTudoParaBackup(casaId: string): Promise<MovimentoEstoque[]> {
    return this.db
      .select()
      .from(movimentoEstoque)
      .where(eq(movimentoEstoque.casaId, casaId))
      .orderBy(desc(movimentoEstoque.criadoEm))
      .all()
      .map(paraDominio);
  }
}
