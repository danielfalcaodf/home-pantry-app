import { useCallback, useEffect, useRef, useState } from 'react';

import { observadorDoBanco } from '../../composicao/observador';
import { obterIdentidadeLocal, produtoRepository } from '../../composicao/repositorios';
import { Produto } from '../../domain/produto/produto';
import {
  alturaDoNivel,
  EstadoItem,
  estadoDoItem,
  rotuloDoItem,
} from '../../domain/produto/estoque.rules';
import { OrdenacaoDaDespensa } from '../../ports/configuracao.repository';
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

/**
 * Reaplica a ordem capturada no mount sobre os dados recém-buscados (design
 * D2): item da ordem some se removido/inativado, item ausente da ordem
 * (criado durante a sessão) é anexado ao final, respeitando a posição
 * relativa que a query já devolveu.
 */
export function aplicarOrdemCongelada(
  itens: ProdutoNaDespensa[],
  ordem: string[],
): ProdutoNaDespensa[] {
  const porId = new Map(itens.map((item) => [item.produto.id, item]));
  const congelados = ordem
    .map((id) => porId.get(id))
    .filter((item): item is ProdutoNaDespensa => item !== undefined);
  const idsCongelados = new Set(ordem);
  const novos = itens.filter((item) => !idsCongelados.has(item.produto.id));
  return [...congelados, ...novos];
}

export function useProdutos(
  repositorio: ProdutoRepository = produtoRepository,
  observador: ObservadorDeMudancas = observadorDoBanco,
  modo: OrdenacaoDaDespensa = 'estado',
): EstadoDaDespensa {
  const [itens, setItens] = useState<ProdutoNaDespensa[]>([]);
  const [carregando, setCarregando] = useState(true);
  // Vive fora do estado de render de propósito (design D2): mudar a ordem
  // congelada nunca deve, por si, disparar re-render — só dados novos devem.
  const ordemCongeladaRef = useRef<string[] | null>(null);

  const recarregar = useCallback(
    async (montado: () => boolean) => {
      const { casaId } = obterIdentidadeLocal();
      const produtos = await repositorio.listarDespensa(casaId, modo);
      if (!montado()) {
        return;
      }
      let enriquecidos = produtos.map(enriquecer);
      // Congela nos modos por estado ou por quantidade — ambos dependem de um
      // valor (bucket de urgência, ou quantidade_atual direto) que muda a
      // cada gesto do stepper (design D2).
      const modoPorEstado = modo === 'estado' || modo === 'estadoInverso';
      const modoPorQuantidade = modo === 'quantidade' || modo === 'quantidadeInversa';
      if (modoPorEstado || modoPorQuantidade) {
        if (ordemCongeladaRef.current === null) {
          ordemCongeladaRef.current = enriquecidos.map((item) => item.produto.id);
        } else {
          enriquecidos = aplicarOrdemCongelada(enriquecidos, ordemCongeladaRef.current);
        }
      }
      setItens(enriquecidos);
      setCarregando(false);
    },
    [repositorio, modo],
  );

  useEffect(() => {
    // A consulta é assíncrona: sem esta guarda, uma resposta que chega depois
    // da desmontagem escreve estado em componente que já saiu da árvore.
    let montado = true;
    const estaMontado = () => montado;
    // Trocar de modo (dependência de `recarregar`) reexecuta este efeito —
    // equivale a um novo "mount" para efeito de congelamento (design D2).
    ordemCongeladaRef.current = null;
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
