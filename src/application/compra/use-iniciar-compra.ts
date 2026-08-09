import { useCallback, useState } from 'react';

import { compraRepository, obterIdentidadeLocal, relogio } from '../../composicao/repositorios';
import { ItemDaLista } from '../../domain/lista/lista';
import { CompraRepository } from '../../ports/compra.repository';
import { obterOuAbrirCompra } from '../lista/compra-aberta';

export type EstadoIniciarCompra = {
  iniciando: boolean;
  /** Materializa os itens do estoque correntes na tela e retorna o id da compra. */
  iniciar: (itens: readonly ItemDaLista[]) => Promise<string>;
};

/**
 * A materialização acontece aqui, não antes (design D1): "iniciar compra"
 * converte o que a tela está mostrando AGORA em `compra_item` com a
 * quantidade e o preço exatamente como exibidos — sem reconsultar nem
 * reaplicar arredondamento (D2). Itens avulsos já pertencem à compra aberta
 * e por isso nunca passam por aqui (1.5).
 */
export function useIniciarCompra(
  compras: CompraRepository = compraRepository,
): EstadoIniciarCompra {
  const [iniciando, setIniciando] = useState(false);

  const iniciar = useCallback(
    async (itens: readonly ItemDaLista[]) => {
      setIniciando(true);
      try {
        const { casaId, usuarioId } = obterIdentidadeLocal();
        const compra = await obterOuAbrirCompra(compras, casaId, usuarioId, relogio.agora());
        const existentes = await compras.listarItens(compra.id);
        const jaMaterializados = new Set(
          existentes
            .filter(({ item }) => item.produtoId !== null && !item.excluido)
            .map(({ item }) => item.produtoId as string),
        );
        const doEstoque = itens.filter(
          (item): item is Extract<ItemDaLista, { tipo: 'produto' }> =>
            item.tipo === 'produto' && !jaMaterializados.has(item.produtoId),
        );
        for (const item of doEstoque) {
          await compras.adicionarItem(compra.id, {
            produtoId: item.produtoId,
            unidade: item.unidade,
            quantidadePlanejada: item.quantidadeAComprar,
            valorEstimadoUnit: item.valorUnitario,
          });
        }
        return compra.id;
      } finally {
        setIniciando(false);
      }
    },
    [compras],
  );

  return { iniciando, iniciar };
}
