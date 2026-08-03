import { useCallback } from 'react';

import { MotivoAjuste } from '../../domain/movimento/movimento';
import { calcularAjuste } from '../../domain/movimento/movimento.rules';
import { Milesimos } from '../../domain/shared/quantidade';
import { obterIdentidadeLocal, produtoRepository, relogio } from '../../composicao/repositorios';
import { Clock } from '../../ports/clock';
import { ProdutoRepository } from '../../ports/produto.repository';

export type ResultadoAjusteDeEstoque =
  | { ajustou: true; movimentoId: string; saldoResultante: Milesimos }
  | { ajustou: false; motivo: 'sem_mudanca' | 'valor_negativo' | 'nao_encontrado' }
  | { erro: true };

/**
 * Corrige a quantidade atual para o VALOR FINAL informado (design D2) — a
 * variação é calculada aqui, não pelo usuário. Mesmo caminho para o toque na
 * quantidade do detalhe (D3), a conferência e o diagnóstico.
 */
export function useAjustarEstoque(
  repositorio: ProdutoRepository = produtoRepository,
  clock: Clock = relogio,
) {
  const ajustar = useCallback(
    async (
      produtoId: string,
      quantidadeAtual: Milesimos,
      valorFinal: Milesimos,
      motivo: MotivoAjuste | null = null,
    ): Promise<ResultadoAjusteDeEstoque> => {
      const calculo = calcularAjuste(quantidadeAtual, valorFinal);
      if (!calculo.ok) {
        return {
          ajustou: false,
          motivo: calculo.erro === 'valor_negativo' ? 'valor_negativo' : 'sem_mudanca',
        };
      }
      try {
        const { usuarioId } = obterIdentidadeLocal();
        const resultado = await repositorio.ajustar({
          produtoId,
          valorFinal,
          usuarioId,
          motivo,
          criadoEm: clock.agora(),
        });
        if (!resultado.ok) {
          return { ajustou: false, motivo: 'nao_encontrado' };
        }
        if (!resultado.valor.gravou) {
          return { ajustou: false, motivo: 'sem_mudanca' };
        }
        return {
          ajustou: true,
          movimentoId: resultado.valor.movimentoId,
          saldoResultante: resultado.valor.saldoResultante,
        };
      } catch {
        return { erro: true };
      }
    },
    [repositorio, clock],
  );

  return { ajustar };
}
