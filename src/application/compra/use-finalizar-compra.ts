import { useCallback, useState } from 'react';

import { compraRepository, obterIdentidadeLocal, produtoRepository, relogio } from '../../composicao/repositorios';
import { efeitosDaFinalizacao } from '../../domain/compra/compra.rules';
import { DivergenciaDePrecoDaCompra, divergenciasDePrecoMarcadas } from './revisao-preco';
import { CompraRepository } from '../../ports/compra.repository';
import { ProdutoRepository } from '../../ports/produto.repository';

export type ResultadoFechamento =
  | { ok: true; itensRepostos: number }
  | { ok: false; motivo: 'quantidade_ausente' | 'falha_na_gravacao' };

export type EstadoFinalizarCompra = {
  finalizando: boolean;
  divergencias: (compraId: string) => Promise<DivergenciaDePrecoDaCompra[]>;
  finalizar: (compraId: string) => Promise<ResultadoFechamento>;
};

/**
 * Ou a compra inteira repõe, ou nada repõe (design da change): calcula os
 * efeitos de uma vez com a regra de domínio e delega ao repositório, que
 * aplica tudo em UMA transação. Uma falha aqui preserva as marcações — elas
 * já estavam em `compra_item`, nada em memória para perder (task 6.8).
 */
export function useFinalizarCompra(
  compras: CompraRepository = compraRepository,
  produtos: ProdutoRepository = produtoRepository,
): EstadoFinalizarCompra {
  const [finalizando, setFinalizando] = useState(false);

  const divergencias = useCallback(
    async (compraId: string) => divergenciasDePrecoMarcadas(await compras.listarItens(compraId)),
    [compras],
  );

  const finalizar = useCallback(
    async (compraId: string): Promise<ResultadoFechamento> => {
      setFinalizando(true);
      try {
        const { casaId, usuarioId } = obterIdentidadeLocal();
        const itensComProduto = await compras.listarItens(compraId);
        const itens = itensComProduto.map(({ item }) => item);
        const produtosDaCasa = await produtos.listarDespensa(casaId);
        const precoConfirmado = new Set(
          itens
            .filter((item) => item.atualizarPreco === true && item.produtoId !== null)
            .map((item) => item.produtoId as string),
        );

        const efeitos = efeitosDaFinalizacao(itens, produtosDaCasa, precoConfirmado);
        if (!efeitos.ok) {
          return { ok: false, motivo: 'quantidade_ausente' };
        }

        const resultado = await compras.finalizar(compraId, efeitos.valor, usuarioId, relogio.agora());
        if (!resultado.ok) {
          return { ok: false, motivo: 'falha_na_gravacao' };
        }
        return { ok: true, itensRepostos: efeitos.valor.reposicoes.length };
      } catch {
        return { ok: false, motivo: 'falha_na_gravacao' };
      } finally {
        setFinalizando(false);
      }
    },
    [compras, produtos],
  );

  return { finalizando, divergencias, finalizar };
}
