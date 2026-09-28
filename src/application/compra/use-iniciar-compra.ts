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
        const jaMaterializados = new Map(
          existentes
            .filter(({ item }) => item.produtoId !== null && !item.excluido)
            .map(({ item }) => [item.produtoId as string, item] as const),
        );
        const doEstoque = itens.filter(
          (item): item is Extract<ItemDaLista, { tipo: 'produto' }> =>
            item.tipo === 'produto' && !jaMaterializados.has(item.produtoId),
        );
        // Lote numa única transação (achado de QA): materializar a lista
        // item a item deixava "Iniciar compra" perceptivelmente lento com
        // muitos itens — cada `adicionarItem` era uma ida e volta ao banco.
        await compras.adicionarItens(
          compra.id,
          doEstoque.map((item) => ({
            produtoId: item.produtoId,
            unidade: item.unidade,
            quantidadePlanejada: item.quantidadeAComprar,
            valorEstimadoUnit: item.valorUnitario,
          })),
        );
        // Item já materializado numa compra aberta residual (ex.: "Iniciar
        // compra" chamado de novo sem finalizar a anterior) fica com preço e
        // quantidade congelados em quando a linha foi criada — editar o
        // preço na Lista, ou a falta mudar, nunca atualiza essa linha
        // sozinho. Pior: um produto removido da Lista e devolvido reaproveita
        // a linha-marcador da exclusão, criada com quantidade de espaço
        // reservado (1 un no lugar dos 2 que faltam). Reabrir a compra é o
        // único momento em que dá pra sincronizar sem mexer em nada durante o
        // Modo Compra em si (D1: só aqui a tela materializa/atualiza o que
        // está exibindo). Só a quantidade planejada é ressincronizada — o
        // ajuste manual do Modo Compra fica em `quantidadeComprada`, intacto.
        for (const item of itens) {
          if (item.tipo !== 'produto') {
            continue;
          }
          const existente = jaMaterializados.get(item.produtoId);
          if (!existente || existente.comprado) {
            continue;
          }
          const mudancas = {
            ...(existente.valorEstimadoUnit !== item.valorUnitario && {
              valorEstimadoUnit: item.valorUnitario,
            }),
            ...(existente.quantidadePlanejada !== item.quantidadeAComprar && {
              quantidadePlanejada: item.quantidadeAComprar,
            }),
          };
          if (Object.keys(mudancas).length > 0) {
            await compras.editarItem(existente.id, mudancas);
          }
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
