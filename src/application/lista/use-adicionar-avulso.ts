import { useCallback, useState } from 'react';

import { compraRepository, obterIdentidadeLocal, relogio } from '../../composicao/repositorios';
import { DadosDoAvulso } from '../../domain/lista/lista';
import { centavos } from '../../domain/shared/dinheiro';
import { deDecimal } from '../../domain/shared/quantidade';
import { CompraRepository } from '../../ports/compra.repository';
import { obterOuAbrirCompra } from './compra-aberta';

export type EstadoAdicaoDeAvulso = {
  adicionando: boolean;
  adicionar: (dados: DadosDoAvulso) => Promise<boolean>;
};

export function useAdicionarAvulso(
  compras: CompraRepository = compraRepository,
): EstadoAdicaoDeAvulso {
  const [adicionando, setAdicionando] = useState(false);

  const adicionar = useCallback(
    async (dados: DadosDoAvulso) => {
      setAdicionando(true);
      try {
        const { casaId, usuarioId } = obterIdentidadeLocal();
        const compra = await obterOuAbrirCompra(compras, casaId, usuarioId, relogio.agora());
        await compras.adicionarItem(compra.id, {
          nomeAvulso: dados.nome,
          unidade: dados.unidade,
          quantidadePlanejada: deDecimal(dados.quantidade),
          valorEstimadoUnit: dados.preco === null ? centavos(0) : centavos(Math.round(dados.preco * 100)),
        });
        return true;
      } catch {
        return false;
      } finally {
        setAdicionando(false);
      }
    },
    [compras],
  );

  return { adicionando, adicionar };
}
