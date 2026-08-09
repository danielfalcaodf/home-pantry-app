import { useCallback, useEffect, useState } from 'react';

import { compraRepository } from '../../composicao/repositorios';
import { Compra } from '../../domain/compra/compra';
import { CompraRepository, ItemComProduto } from '../../ports/compra.repository';

export type { ItemComProduto } from '../../ports/compra.repository';

export type EstadoDoDetalheDaCompra = {
  carregando: boolean;
  compra: Compra | null;
  itens: ItemComProduto[];
};

/**
 * Somente leitura, sem exceção (mesma regra do histórico do produto): esta
 * tela nunca edita item nem reabre a compra. `listarItens` já traz o produto
 * por junção externa em uma única consulta (DATABASE §6.7) — não há N+1
 * mesmo com muitos itens.
 */
export function useDetalheDaCompra(
  compraId: string,
  compras: CompraRepository = compraRepository,
): EstadoDoDetalheDaCompra {
  const [compra, setCompra] = useState<Compra | null>(null);
  const [itens, setItens] = useState<ItemComProduto[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(
    async (montado: () => boolean) => {
      const [compraCarregada, itensCarregados] = await Promise.all([
        compras.obterPorId(compraId),
        compras.listarItens(compraId),
      ]);
      if (!montado()) {
        return;
      }
      setCompra(compraCarregada);
      setItens(itensCarregados);
      setCarregando(false);
    },
    [compraId, compras],
  );

  useEffect(() => {
    let montado = true;
    const estaMontado = () => montado;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar(estaMontado);
    return () => {
      montado = false;
    };
  }, [carregar]);

  return { carregando, compra, itens };
}
