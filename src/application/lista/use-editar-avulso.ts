import { useCallback, useState } from 'react';

import { compraRepository } from '../../composicao/repositorios';
import { DadosDoAvulso } from '../../domain/lista/lista';
import { centavos } from '../../domain/shared/dinheiro';
import { deDecimal } from '../../domain/shared/quantidade';
import { CompraRepository } from '../../ports/compra.repository';

export type EstadoEdicaoDeAvulso = {
  editando: boolean;
  editar: (itemId: string, dados: DadosDoAvulso) => Promise<boolean>;
  remover: (itemId: string) => Promise<boolean>;
};

// Avulso não referencia produto (D1 é só para exclusão de faltante): editar
// e remover aqui é edição/exclusão direta da linha em compra_item.
export function useEditarAvulso(compras: CompraRepository = compraRepository): EstadoEdicaoDeAvulso {
  const [editando, setEditando] = useState(false);

  const editar = useCallback(
    async (itemId: string, dados: DadosDoAvulso) => {
      setEditando(true);
      try {
        await compras.editarItem(itemId, {
          nomeAvulso: dados.nome,
          unidade: dados.unidade,
          quantidadePlanejada: deDecimal(dados.quantidade),
          valorEstimadoUnit: dados.preco === null ? centavos(0) : centavos(Math.round(dados.preco * 100)),
        });
        return true;
      } catch {
        return false;
      } finally {
        setEditando(false);
      }
    },
    [compras],
  );

  const remover = useCallback(
    async (itemId: string) => {
      try {
        await compras.removerItem(itemId);
        return true;
      } catch {
        return false;
      }
    },
    [compras],
  );

  return { editando, editar, remover };
}
