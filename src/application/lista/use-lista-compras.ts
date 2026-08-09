import { useCallback, useEffect, useState } from 'react';

import { observadorDoBanco } from '../../composicao/observador';
import { compraRepository, obterIdentidadeLocal, produtoRepository } from '../../composicao/repositorios';
import { compuserLista } from '../../domain/lista/lista.rules';
import { ItemDaLista } from '../../domain/lista/lista';
import { CompraRepository } from '../../ports/compra.repository';
import { ObservadorDeMudancas } from '../../ports/observador-de-mudancas';
import { ProdutoRepository } from '../../ports/produto.repository';

export type EstadoDaLista = {
  itens: ItemDaLista[];
  carregando: boolean;
};

export function useListaDeCompras(
  produtos: ProdutoRepository = produtoRepository,
  compras: CompraRepository = compraRepository,
  observador: ObservadorDeMudancas = observadorDoBanco,
): EstadoDaLista {
  const [itens, setItens] = useState<ItemDaLista[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(
    async (montado: () => boolean) => {
      const { casaId } = obterIdentidadeLocal();
      const faltantes = await produtos.listarFaltantes(casaId);
      const compraAberta = await compras.obterAberta(casaId);
      const itensDaCompraAberta = compraAberta
        ? await compras.listarItens(compraAberta.id)
        : [];

      // Um item da compra aberta é ou um avulso (produto null) ou a marcação
      // de exclusão de um faltante (excluído = true, produto preenchido).
      const avulsos = itensDaCompraAberta
        .filter(({ item }) => item.produtoId === null)
        .map(({ item }) => item);
      const idsExcluidos = new Set(
        itensDaCompraAberta
          .filter(({ item }) => item.excluido)
          .map(({ item }) => item.produtoId as string),
      );

      if (!montado()) {
        return;
      }
      setItens(compuserLista(faltantes, avulsos, idsExcluidos));
      setCarregando(false);
    },
    [produtos, compras],
  );

  useEffect(() => {
    let montado = true;
    const estaMontado = () => montado;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void recarregar(estaMontado);
    const cancelarAssinatura = observador.assinar(() => {
      void recarregar(estaMontado);
    });
    return () => {
      montado = false;
      cancelarAssinatura();
    };
  }, [recarregar, observador]);

  return { itens, carregando };
}
