import { useCallback, useEffect, useState } from 'react';

import { observadorDoBanco } from '../../composicao/observador';
import { obterIdentidadeLocal, produtoRepository } from '../../composicao/repositorios';
import { Produto } from '../../domain/produto/produto';
import {
  alturaDoNivel,
  EstadoItem,
  estadoDoItem,
  rotuloDoItem,
} from '../../domain/produto/estoque.rules';
import { ObservadorDeMudancas } from '../../ports/observador-de-mudancas';
import { ProdutoRepository } from '../../ports/produto.repository';

/**
 * O que a apresentação recebe: estado, fração e rótulo já calculados pelo
 * domínio. Nenhum componente faz aritmética sobre quantidade (FRONTEND §12.2).
 */
export type ProdutoNaDespensa = {
  produto: Produto;
  estado: EstadoItem;
  fracao: number;
  temSobra: boolean;
  rotulo: string;
};

export function enriquecer(produto: Produto): ProdutoNaDespensa {
  const { fracao, temSobra } = alturaDoNivel(produto);
  return {
    produto,
    estado: estadoDoItem(produto),
    fracao,
    temSobra,
    rotulo: rotuloDoItem(produto),
  };
}

export type EstadoDaDespensa = {
  itens: ProdutoNaDespensa[];
  carregando: boolean;
};

export function useProdutos(
  repositorio: ProdutoRepository = produtoRepository,
  observador: ObservadorDeMudancas = observadorDoBanco,
): EstadoDaDespensa {
  const [itens, setItens] = useState<ProdutoNaDespensa[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(
    async (montado: () => boolean) => {
      const { casaId } = obterIdentidadeLocal();
      // A ordenação vem do SQL (DATABASE §6.1) — a apresentação não reordena.
      const produtos = await repositorio.listarDespensa(casaId);
      if (!montado()) {
        return;
      }
      setItens(produtos.map(enriquecer));
      setCarregando(false);
    },
    [repositorio],
  );

  useEffect(() => {
    // A consulta é assíncrona: sem esta guarda, uma resposta que chega depois
    // da desmontagem escreve estado em componente que já saiu da árvore.
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

  return { itens, carregando };
}
