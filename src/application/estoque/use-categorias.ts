import { useCallback, useEffect, useState } from 'react';

import { observadorDoBanco } from '../../composicao/observador';
import { obterIdentidadeLocal, produtoRepository } from '../../composicao/repositorios';
import { ObservadorDeMudancas } from '../../ports/observador-de-mudancas';
import { ProdutoRepository } from '../../ports/produto.repository';

export function useCategorias(
  repositorio: ProdutoRepository = produtoRepository,
  observador: ObservadorDeMudancas = observadorDoBanco,
): string[] {
  const [categorias, setCategorias] = useState<string[]>([]);

  const recarregar = useCallback(
    async (montado: () => boolean) => {
      const { casaId } = obterIdentidadeLocal();
      const encontradas = await repositorio.listarCategorias(casaId);
      if (montado()) {
        setCategorias(encontradas);
      }
    },
    [repositorio],
  );

  useEffect(() => {
    let montado = true;
    const estaMontado = () => montado;
    // O lint não enxerga que `recarregar` só escreve estado depois do await —
    // a escrita nunca é síncrona aqui, então não há render em cascata.
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

  return categorias;
}
