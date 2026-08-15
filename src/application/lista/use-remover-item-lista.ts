import { useCallback, useState } from 'react';

import { compraRepository, obterIdentidadeLocal, relogio } from '../../composicao/repositorios';
import { ItemListaProduto } from '../../domain/lista/lista';
import { milesimos } from '../../domain/shared/quantidade';
import { CompraRepository } from '../../ports/compra.repository';
import { obterOuAbrirCompra } from './compra-aberta';

// Quantidade exigida pelo CHECK do banco (> 0), mas irrelevante: a marcação
// de exclusão nunca é exibida, só filtrada na composição da lista.
const QUANTIDADE_PLACEHOLDER = milesimos(1000);

export type RemocaoDaLista = {
  itemExclusaoId: string;
  nome: string;
  /** Se `remover` criou uma linha nova (true) ou reaproveitou uma já
   *  materializada por `iniciarCompra` (false) — `desfazer` precisa saber
   *  qual dos dois pra decidir entre apagar a linha ou só reverter a
   *  exclusão (ACHADO: duplicata de compra_item pro mesmo produto). */
  criouNovaLinha: boolean;
};

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
 *
 * Se o produto já tem uma linha de `compra_item` na compra aberta (porque
 * "Iniciar compra" já materializou esse item antes de a pessoa voltar pra
 * lista e remover), reaproveita essa linha marcando `excluido: true` em vez
 * de inserir outra — duas linhas pro mesmo produto na mesma compra faziam
 * o item sumir da lista pra sempre, mesmo depois de reiniciar o app,
 * porque a composição da lista exclui pelo produtoId de QUALQUER linha
 * excluída, não pela linha mais recente (ACHADO de reatividade, na
 * verdade um bug de dado duplicado, não de timing).
 */
export function useRemoverItemDaLista(
  compras: CompraRepository = compraRepository,
): EstadoRemocaoDaLista {
  const [ultimaRemocao, setUltimaRemocao] = useState<RemocaoDaLista | null>(null);

  const remover = useCallback(
    async (item: ItemListaProduto) => {
      const { casaId, usuarioId } = obterIdentidadeLocal();
      const compra = await obterOuAbrirCompra(compras, casaId, usuarioId, relogio.agora());
      const existentes = await compras.listarItens(compra.id);
      const existente = existentes.find(
        ({ item: itemExistente }) =>
          itemExistente.produtoId === item.produtoId && !itemExistente.excluido,
      );
      if (existente) {
        await compras.editarItem(existente.item.id, { excluido: true });
        setUltimaRemocao({ itemExclusaoId: existente.item.id, nome: item.nome, criouNovaLinha: false });
        return;
      }
      const criado = await compras.adicionarItem(compra.id, {
        produtoId: item.produtoId,
        unidade: item.unidade,
        quantidadePlanejada: QUANTIDADE_PLACEHOLDER,
        excluido: true,
      });
      setUltimaRemocao({ itemExclusaoId: criado.id, nome: item.nome, criouNovaLinha: true });
    },
    [compras],
  );

  const desfazer = useCallback(async () => {
    if (!ultimaRemocao) {
      return;
    }
    if (ultimaRemocao.criouNovaLinha) {
      await compras.removerItem(ultimaRemocao.itemExclusaoId);
    } else {
      await compras.editarItem(ultimaRemocao.itemExclusaoId, { excluido: false });
    }
    setUltimaRemocao(null);
  }, [compras, ultimaRemocao]);

  const limpar = useCallback(() => setUltimaRemocao(null), []);

  return { ultimaRemocao, remover, desfazer, limpar };
}
