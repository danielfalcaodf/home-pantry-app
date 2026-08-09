import { useCallback } from 'react';

import { obterIdentidadeLocal, produtoRepository, relogio } from '../../composicao/repositorios';
import { Milesimos } from '../../domain/shared/quantidade';
import { Clock } from '../../ports/clock';
import { ProdutoRepository } from '../../ports/produto.repository';
import { ResultadoConsumo } from './use-dar-baixa';

/** Reposição sem compra associada — "Repus", não "reposição de estoque". */
export function useReporPontual(
  repositorio: ProdutoRepository = produtoRepository,
  clock: Clock = relogio,
) {
  const registrar = useCallback(
    async (produtoId: string, quantidade: Milesimos): Promise<ResultadoConsumo> => {
      try {
        const { usuarioId } = obterIdentidadeLocal();
        const resultado = await repositorio.repor({
          produtoId,
          quantidade,
          usuarioId,
          criadoEm: clock.agora(),
        });
        if (!resultado.ok || !resultado.valor.gravou) {
          return { gravou: false, motivo: 'nao_encontrado' };
        }
        return {
          gravou: true,
          movimentoId: resultado.valor.movimentoId,
          saldoResultante: resultado.valor.saldoResultante,
          zerou: false,
        };
      } catch {
        return { erro: true };
      }
    },
    [repositorio, clock],
  );

  return { registrar };
}
