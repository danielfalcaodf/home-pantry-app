import { useCallback, useEffect, useState } from 'react';

import { observadorDoBanco } from '../../composicao/observador';
import { compraRepository, obterIdentidadeLocal, produtoRepository } from '../../composicao/repositorios';
import { compuserLista } from '../../domain/lista/lista.rules';
import { ItemDaLista } from '../../domain/lista/lista';
import { CompraRepository } from '../../ports/compra.repository';
import { ObservadorDeMudancas } from '../../ports/observador-de-mudancas';
import { ProdutoRepository } from '../../ports/produto.repository';

// Item excluído da compra aberta, ainda visível numa seção separada —
// exclusão é temporária por design (ACHADO de usabilidade), não some pra
// sempre: a pessoa pode trazer de volta manualmente, ou ele volta sozinho
// no próximo "Usei" desse produto (useDarBaixa).
export type ItemDesativado = {
  itemId: string;
  produtoId: string;
  nome: string;
  categoria: string | null;
};

export type EstadoDaLista = {
  itens: ItemDaLista[];
  desativados: ItemDesativado[];
  carregando: boolean;
};

export function useListaDeCompras(
  produtos: ProdutoRepository = produtoRepository,
  compras: CompraRepository = compraRepository,
  observador: ObservadorDeMudancas = observadorDoBanco,
): EstadoDaLista {
  const [itens, setItens] = useState<ItemDaLista[]>([]);
  const [desativados, setDesativados] = useState<ItemDesativado[]>([]);
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
      const excluidos = itensDaCompraAberta.filter(({ item }) => item.excluido);
      const idsExcluidos = new Set(
        excluidos.map(({ item }) => item.produtoId as string),
      );

      if (!montado()) {
        return;
      }
      setItens(compuserLista(faltantes, avulsos, idsExcluidos));
      setDesativados(
        excluidos.map(({ item, produto }) => ({
          itemId: item.id,
          produtoId: item.produtoId as string,
          nome: produto?.nome ?? '',
          categoria: produto?.categoria ?? null,
        })),
      );
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

  return { itens, desativados, carregando };
}
