import { useCallback, useRef } from 'react';

import {
  compraRepository,
  obterIdentidadeLocal,
  produtoRepository,
  relogio,
} from '../../composicao/repositorios';
import { Milesimos } from '../../domain/shared/quantidade';
import { Clock } from '../../ports/clock';
import { CompraRepository } from '../../ports/compra.repository';
import { ProdutoRepository } from '../../ports/produto.repository';

// Reativa a exclusão de um faltante da lista quando a pessoa usa mais dele:
// "removi da lista esta compra" não deveria significar "nunca mais avisa",
// e um novo "Usei" é o sinal mais direto de que a necessidade voltou (ACHADO
// pós-arquivamento de correcao-lista-de-compras — usuário esperava que
// apertar "Usei" de novo trouxesse o item de volta, mesmo tendo removido
// pelo X antes). Sem compra aberta, não há nada a reativar.
async function reativarSeExcluidoDaLista(
  compras: CompraRepository,
  casaId: string,
  produtoId: string,
) {
  const compraAberta = await compras.obterAberta(casaId);
  if (!compraAberta) {
    return;
  }
  const itens = await compras.listarItens(compraAberta.id);
  const excluido = itens.find(
    ({ item }) => item.produtoId === produtoId && item.excluido,
  );
  if (excluido) {
    await compras.editarItem(excluido.item.id, { excluido: false });
  }
}

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
  compras: CompraRepository = compraRepository,
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
          const { casaId, usuarioId } = obterIdentidadeLocal();
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
          await reativarSeExcluidoDaLista(compras, casaId, produtoId);
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
    [repositorio, clock, compras],
  );

  return { registrar };
}
