import { useCallback } from 'react';

import { movimentoRepository, relogio } from '../../composicao/repositorios';
import { Milesimos } from '../../domain/shared/quantidade';
import { Clock } from '../../ports/clock';
import { MovimentoRepository } from '../../ports/movimento.repository';

export type ResultadoDesfazer =
  | { desfez: true; saldoResultante: Milesimos }
  | { desfez: false };

/**
 * Desfazer é sempre por identificador do movimento, nunca "o último gravado":
 * com três registros rápidos, o toast visível descreve um movimento
 * específico e é esse que precisa voltar.
 */
export function useDesfazerMovimento(
  repositorio: MovimentoRepository = movimentoRepository,
  clock: Clock = relogio,
) {
  const desfazer = useCallback(
    async (movimentoId: string): Promise<ResultadoDesfazer> => {
      try {
        const resultado = await repositorio.desfazer(movimentoId, clock.agora());
        if (!resultado.ok) {
          return { desfez: false };
        }
        return { desfez: true, saldoResultante: resultado.valor.saldoResultante };
      } catch {
        return { desfez: false };
      }
    },
    [repositorio, clock],
  );

  return { desfazer };
}
