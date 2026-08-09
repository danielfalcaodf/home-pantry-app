import { useCallback, useState } from 'react';

import { compraRepository, obterIdentidadeLocal, relogio } from '../../composicao/repositorios';
import { ItemListaProduto } from '../../domain/lista/lista';
import { milesimos } from '../../domain/shared/quantidade';
import { CompraRepository } from '../../ports/compra.repository';
import { obterOuAbrirCompra } from './compra-aberta';

// Quantidade exigida pelo CHECK do banco (> 0), mas irrelevante: a marcação
// de exclusão nunca é exibida, só filtrada na composição da lista.
const QUANTIDADE_PLACEHOLDER = milesimos(1000);

export type RemocaoDaLista = { itemExclusaoId: string; nome: string };

export type EstadoRemocaoDaLista = {
  ultimaRemocao: RemocaoDaLista | null;
  remover: (item: ItemListaProduto) => Promise<void>;
  desfazer: () => Promise<void>;
  limpar: () => void;
};

/**
 * Remover um faltante da lista não apaga o produto nem mexe no estoque
 * (requisito "Remover item da lista sem alterar o estoque") — grava a
 * exclusão na compra aberta, criada sob demanda (design D1/D2).
 */
export function useRemoverItemDaLista(
  compras: CompraRepository = compraRepository,
): EstadoRemocaoDaLista {
  const [ultimaRemocao, setUltimaRemocao] = useState<RemocaoDaLista | null>(null);

  const remover = useCallback(
    async (item: ItemListaProduto) => {
      const { casaId, usuarioId } = obterIdentidadeLocal();
      const compra = await obterOuAbrirCompra(compras, casaId, usuarioId, relogio.agora());
      const criado = await compras.adicionarItem(compra.id, {
        produtoId: item.produtoId,
        unidade: item.unidade,
        quantidadePlanejada: QUANTIDADE_PLACEHOLDER,
        excluido: true,
      });
      setUltimaRemocao({ itemExclusaoId: criado.id, nome: item.nome });
    },
    [compras],
  );

  const desfazer = useCallback(async () => {
    if (!ultimaRemocao) {
      return;
    }
    await compras.removerItem(ultimaRemocao.itemExclusaoId);
    setUltimaRemocao(null);
  }, [compras, ultimaRemocao]);

  const limpar = useCallback(() => setUltimaRemocao(null), []);

  return { ultimaRemocao, remover, desfazer, limpar };
}
