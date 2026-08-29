import { useCallback, useState } from 'react';

import { compraRepository, obterIdentidadeLocal, relogio } from '../../composicao/repositorios';
import { ItemDaLista } from '../../domain/lista/lista';
import { CompraRepository } from '../../ports/compra.repository';

export type ResultadoAoRecomecarCompra =
  | { ok: true; compraId: string }
  | { ok: false };

export type EstadoRecomecarCompra = {
  recomecando: boolean;
  recomecar: (itens: readonly ItemDaLista[]) => Promise<ResultadoAoRecomecarCompra>;
};

export function useRecomecarCompra(
  compras: CompraRepository = compraRepository,
): EstadoRecomecarCompra {
  const [recomecando, setRecomecando] = useState(false);

  const recomecar = useCallback(
    async (itens: readonly ItemDaLista[]): Promise<ResultadoAoRecomecarCompra> => {
      setRecomecando(true);
      try {
        const { casaId, usuarioId } = obterIdentidadeLocal();
        const aberta = await compras.obterAberta(casaId);
        if (!aberta) {
          return { ok: false };
        }
        const resultado = await compras.recomecar(aberta.id, {
          casaId,
          usuarioId,
          criadaEm: relogio.agora(),
          itens: itens.map((item) =>
            item.tipo === 'produto'
              ? {
                  produtoId: item.produtoId,
                  unidade: item.unidade,
                  quantidadePlanejada: item.quantidadeAComprar,
                  valorEstimadoUnit: item.valorUnitario,
                }
              : {
                  nomeAvulso: item.nome,
                  unidade: item.unidade,
                  quantidadePlanejada: item.quantidadeAComprar,
                  valorEstimadoUnit: item.valorUnitario,
                },
          ),
        });
        return resultado.ok ? { ok: true, compraId: resultado.valor.id } : { ok: false };
      } catch {
        return { ok: false };
      } finally {
        setRecomecando(false);
      }
    },
    [compras],
  );

  return { recomecando, recomecar };
}
