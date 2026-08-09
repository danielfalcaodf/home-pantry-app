import { useCallback, useState } from 'react';

import { itensDaListaBase } from '../../composicao/lista-base';
import { obterIdentidadeLocal, produtoRepository } from '../../composicao/repositorios';
import { ItemListaBase, ProdutoRepository } from '../../ports/produto.repository';

export type EstadoAdocao = {
  itens: ItemListaBase[];
  adotar: (escolhidos: ItemListaBase[]) => Promise<boolean>;
  adotando: boolean;
  falhou: boolean;
};

export function useListaBase(
  repositorio: ProdutoRepository = produtoRepository,
  itens: ItemListaBase[] = itensDaListaBase(),
): EstadoAdocao {
  const [adotando, setAdotando] = useState(false);
  const [falhou, setFalhou] = useState(false);

  const adotar = useCallback(
    async (escolhidos: ItemListaBase[]) => {
      if (escolhidos.length === 0) {
        return true;
      }
      setAdotando(true);
      setFalhou(false);
      try {
        // Transação única no repositório: ou entram todos, ou nenhum —
        // despensa pela metade é pior que despensa vazia.
        await repositorio.adotarListaBase(obterIdentidadeLocal().casaId, escolhidos);
        return true;
      } catch {
        setFalhou(true);
        return false;
      } finally {
        setAdotando(false);
      }
    },
    [repositorio],
  );

  return { itens, adotar, adotando, falhou };
}
