import { useCallback, useEffect, useState } from 'react';

import { observadorDoBanco } from '../../composicao/observador';
import { obterIdentidadeLocal, produtoRepository } from '../../composicao/repositorios';
import { EstadoItem, estadoDoItem, totalDaLista } from '../../domain/produto/estoque.rules';
import { Centavos, centavos, converterValorBruto } from '../../domain/shared/dinheiro';
import { ObservadorDeMudancas } from '../../ports/observador-de-mudancas';
import { ProdutoRepository } from '../../ports/produto.repository';

export type ContagensPorEstado = Record<EstadoItem, number>;

/** Formato de `presentation/format/agrupar-despensa.ts:ItemAgrupavel` — a
 *  apresentação deriva a contagem "Faltando" (critico + emFalta) chamando
 *  `contarPorEstado` sobre esta lista, o mesmo cálculo usado na Despensa
 *  (application/ não importa presentation/, por isso a soma não é feita aqui). */
export type ItemDaDespensaPorEstado = {
  produto: { id: string; nome: string; categoria: string | null };
  estado: EstadoItem;
};

export type ResumoDeValores = {
  carregando: boolean;
  /** Patrimônio: o que já está em casa (design D2 — nunca somado ao da lista). */
  valorDoEstoque: Centavos;
  contagemSemPrecoEstoque: number;
  /** Despesa futura: custo de reposição do que está faltando. */
  valorDaLista: Centavos;
  contagemSemPrecoLista: number;
  contagensPorEstado: ContagensPorEstado;
  itensDaDespensaPorEstado: ItemDaDespensaPorEstado[];
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
    itensDaDespensaPorEstado: [],
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

      const itensDaDespensaPorEstado = despensa.map((produto) => ({
        produto: { id: produto.id, nome: produto.nome, categoria: produto.categoria },
        estado: estadoDoItem(produto),
      }));
      const contagensPorEstado = itensDaDespensaPorEstado.reduce<ContagensPorEstado>(
        (contagens, item) => ({ ...contagens, [item.estado]: contagens[item.estado] + 1 }),
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
        itensDaDespensaPorEstado,
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
