import { MovimentoEstoque } from '../domain/movimento/movimento';
import { Milesimos } from '../domain/shared/quantidade';
import { Result } from '../shared/result';

export type DivergenciaReconciliacao = {
  produtoId: string;
  nome: string;
  materializado: Milesimos;
  calculado: Milesimos;
};

export type ResultadoDesfazer = {
  movimentoInversoId: string;
  saldoResultante: Milesimos;
};

export type ResultadoAjuste = {
  movimentoId: string;
  saldoResultante: Milesimos;
};

export type ResultadoCorrecaoEmBloco = { corrigidos: number };

// APPEND-ONLY por contrato: esta interface não declara atualização nem
// remoção — desfazer não tem como ser implementado errado se o método
// errado não existe (design D3).
export interface MovimentoRepository {
  historicoPorProduto(produtoId: string, limite?: number): Promise<MovimentoEstoque[]>;
  historicoPorCasa(casaId: string, limite?: number): Promise<MovimentoEstoque[]>;
  /**
   * Desfazer: insere o movimento INVERSO e ajusta a quantidade do produto
   * na mesma transação. O movimento original permanece intocado.
   */
  desfazer(
    movimentoOriginalId: string,
    criadoEm: number,
  ): Promise<Result<ResultadoDesfazer, 'nao_encontrado'>>;
  /** Compara quantidade materializada com a soma dos movimentos (DATABASE §6.6). */
  reconciliar(casaId: string): Promise<DivergenciaReconciliacao[]>;
  /**
   * Corrige uma divergência encontrada pela reconciliação: grava um
   * movimento `ajuste` levando a quantidade materializada à soma calculada
   * dos movimentos, na mesma transação — nunca altera a quantidade em
   * silêncio (design D4 da change backup-restore-json).
   */
  corrigirDivergencia(
    produtoId: string,
    usuarioId: string,
    calculado: Milesimos,
    criadoEm: number,
  ): Promise<Result<ResultadoAjuste, 'nao_encontrado'>>;
  /**
   * Corrige TODAS as divergências da casa em uma única transação — um
   * movimento de ajuste por produto (task 4.5). Falha no meio não deixa
   * correção parcial: nada muda.
   */
  corrigirTodasDivergencias(
    casaId: string,
    usuarioId: string,
    criadoEm: number,
  ): Promise<ResultadoCorrecaoEmBloco>;
  /** Todo o histórico da casa, sem truncamento por data — uso exclusivo do backup. */
  listarTudoParaBackup(casaId: string): Promise<MovimentoEstoque[]>;
}
