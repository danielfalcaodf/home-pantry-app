import { MovimentoEstoque } from '../../../domain/movimento/movimento';
import { Milesimos } from '../../../domain/shared/quantidade';
import {
  DivergenciaReconciliacao,
  MovimentoRepository,
  ResultadoAjuste,
  ResultadoCorrecaoEmBloco,
  ResultadoDesfazer,
} from '../../../ports/movimento.repository';
import { falha, Result, sucesso } from '../../../shared/result';

export class MovimentoRepositorioFalso implements MovimentoRepository {
  historico: MovimentoEstoque[] = [];
  divergencias: DivergenciaReconciliacao[] = [];
  chamadasReconciliar: string[] = [];
  chamadasCorrigir: { produtoId: string; calculado: Milesimos }[] = [];

  async historicoPorProduto(): Promise<MovimentoEstoque[]> {
    return this.historico;
  }

  async historicoPorCasa(): Promise<MovimentoEstoque[]> {
    return this.historico;
  }

  async desfazer(): Promise<Result<ResultadoDesfazer, 'nao_encontrado'>> {
    return falha('nao_encontrado');
  }

  async reconciliar(casaId: string): Promise<DivergenciaReconciliacao[]> {
    this.chamadasReconciliar.push(casaId);
    return this.divergencias;
  }

  async corrigirDivergencia(
    produtoId: string,
    _usuarioId: string,
    calculado: Milesimos,
  ): Promise<Result<ResultadoAjuste, 'nao_encontrado'>> {
    this.chamadasCorrigir.push({ produtoId, calculado });
    this.divergencias = this.divergencias.filter((d) => d.produtoId !== produtoId);
    return sucesso({ movimentoId: `ajuste-${produtoId}`, saldoResultante: calculado });
  }

  async corrigirTodasDivergencias(): Promise<ResultadoCorrecaoEmBloco> {
    const corrigidos = this.divergencias.length;
    this.chamadasCorrigir.push(
      ...this.divergencias.map((d) => ({ produtoId: d.produtoId, calculado: d.calculado })),
    );
    this.divergencias = [];
    return { corrigidos };
  }

  async listarTudoParaBackup(): Promise<MovimentoEstoque[]> {
    return this.historico;
  }
}
