import { useCallback, useEffect, useState } from 'react';

import { observadorDoBanco } from '../../composicao/observador';
import { obterIdentidadeLocal, produtoRepository } from '../../composicao/repositorios';
import { EstadoItem, estadoDoItem, totalDaLista } from '../../domain/produto/estoque.rules';
import { Centavos, centavos, converterValorBruto } from '../../domain/shared/dinheiro';
import { ObservadorDeMudancas } from '../../ports/observador-de-mudancas';
import { ProdutoRepository } from '../../ports/produto.repository';

export type ContagensPorEstado = Record<EstadoItem, number>;

export type ResumoDeValores = {
  carregando: boolean;
  /** Patrimônio: o que já está em casa (design D2 — nunca somado ao da lista). */
  valorDoEstoque: Centavos;
  contagemSemPrecoEstoque: number;
  /** Despesa futura: custo de reposição do que está faltando. */
  valorDaLista: Centavos;
  contagemSemPrecoLista: number;
  contagensPorEstado: ContagensPorEstado;
};

const CONTAGENS_VAZIAS: ContagensPorEstado = { critico: 0, emFalta: 0, ok: 0 };

/**
 * Os dois valores nunca se tocam aqui (design D2): `valorDoEstoque` vem do
 * bruto agregado em SQL (DATABASE §6.5) convertido uma única vez pelo
 * domínio; `valorDaLista` reaproveita `totalDaLista`, a mesma regra que a
 * tela Lista usa — nenhuma aritmética de milésimos/centavos é repetida aqui.
 */
export function useResumoDeValores(
  produtos: ProdutoRepository = produtoRepository,
  observador: ObservadorDeMudancas = observadorDoBanco,
): ResumoDeValores {
  const [estado, setEstado] = useState<Omit<ResumoDeValores, 'carregando'>>({
    valorDoEstoque: centavos(0),
    contagemSemPrecoEstoque: 0,
    valorDaLista: centavos(0),
    contagemSemPrecoLista: 0,
    contagensPorEstado: CONTAGENS_VAZIAS,
  });
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(
    async (montado: () => boolean) => {
      const { casaId } = obterIdentidadeLocal();
      const [bruto, despensa, faltantes] = await Promise.all([
        produtos.valorBrutoDoEstoque(casaId),
        produtos.listarDespensa(casaId),
        produtos.listarFaltantes(casaId),
      ]);
      if (!montado()) {
        return;
      }

      const contagensPorEstado = despensa.reduce<ContagensPorEstado>(
        (contagens, produto) => {
          const estadoDoProduto = estadoDoItem(produto);
          return { ...contagens, [estadoDoProduto]: contagens[estadoDoProduto] + 1 };
        },
        { ...CONTAGENS_VAZIAS },
      );
      const contagemSemPrecoEstoque = despensa.filter((produto) => produto.valorUnitario <= 0).length;
      const { total: valorDaLista, itensSemPreco: contagemSemPrecoLista } = totalDaLista(faltantes);

      setEstado({
        valorDoEstoque: converterValorBruto(bruto),
        contagemSemPrecoEstoque,
        valorDaLista,
        contagemSemPrecoLista,
        contagensPorEstado,
      });
      setCarregando(false);
    },
    [produtos],
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

  return { carregando, ...estado };
}
