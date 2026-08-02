import { useCallback, useRef } from 'react';

import { obterIdentidadeLocal, produtoRepository, relogio } from '../../composicao/repositorios';
import { Milesimos } from '../../domain/shared/quantidade';
import { Clock } from '../../ports/clock';
import { ProdutoRepository } from '../../ports/produto.repository';

export type RegistroDeConsumo =
  | { gravou: true; movimentoId: string; saldoResultante: Milesimos; zerou: boolean }
  | { gravou: false; motivo: 'estoque_zerado' | 'nao_encontrado' };

export type FalhaDeGravacao = { erro: true };

export type ResultadoConsumo = RegistroDeConsumo | FalhaDeGravacao;

export function ehFalha(resultado: ResultadoConsumo): resultado is FalhaDeGravacao {
  return 'erro' in resultado;
}

/**
 * Caminho crítico (KPI K4): sem confirmação, sem navegação, sem spinner.
 * A regra de saldo não-negativo e o "nada a gravar" vivem no domínio; aqui só
 * se despacha a transação e se serializa por item.
 */
export function useDarBaixa(
  repositorio: ProdutoRepository = produtoRepository,
  clock: Clock = relogio,
) {
  // Toques rápidos sucessivos no MESMO item viram um registro cada, em fila:
  // sem isso, duas transações concorrentes leriam o mesmo saldo e a segunda
  // gravaria um resultante errado.
  const filaPorProduto = useRef(new Map<string, Promise<unknown>>());

  const registrar = useCallback(
    async (produtoId: string, quantidade: Milesimos): Promise<ResultadoConsumo> => {
      const anterior = filaPorProduto.current.get(produtoId) ?? Promise.resolve();
      const atual = anterior.then(async (): Promise<ResultadoConsumo> => {
        try {
          const { usuarioId } = obterIdentidadeLocal();
          const resultado = await repositorio.darBaixa({
            produtoId,
            quantidade,
            usuarioId,
            criadoEm: clock.agora(),
          });
          if (!resultado.ok) {
            return { gravou: false, motivo: 'nao_encontrado' };
          }
          if (!resultado.valor.gravou) {
            return { gravou: false, motivo: 'estoque_zerado' };
          }
          return {
            gravou: true,
            movimentoId: resultado.valor.movimentoId,
            saldoResultante: resultado.valor.saldoResultante,
            zerou: resultado.valor.saldoResultante === 0,
          };
        } catch {
          return { erro: true };
        }
      });
      filaPorProduto.current.set(produtoId, atual);
      return atual;
    },
    [repositorio, clock],
  );

  return { registrar };
}
