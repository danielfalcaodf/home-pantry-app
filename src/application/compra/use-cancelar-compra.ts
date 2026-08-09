import { useCallback, useState } from 'react';

import { compraRepository, relogio } from '../../composicao/repositorios';
import { CompraRepository } from '../../ports/compra.repository';

export type EstadoCancelarCompra = {
  cancelando: boolean;
  cancelar: (compraId: string) => Promise<boolean>;
};

/**
 * A situação `cancelada` mantém a compra no histórico (design "Open
 * Questions"): não repõe nada, só libera `ux_compra_aberta` para uma compra
 * nova. Diferente de fechar: aqui não há efeito nenhum a aplicar.
 */
export function useCancelarCompra(
  compras: CompraRepository = compraRepository,
): EstadoCancelarCompra {
  const [cancelando, setCancelando] = useState(false);

  const cancelar = useCallback(
    async (compraId: string) => {
      setCancelando(true);
      try {
        const resultado = await compras.cancelar(compraId, relogio.agora());
        return resultado.ok;
      } finally {
        setCancelando(false);
      }
    },
    [compras],
  );

  return { cancelando, cancelar };
}
