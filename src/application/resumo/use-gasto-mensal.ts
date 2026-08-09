import { useCallback, useEffect, useState } from 'react';

import { observadorDoBanco } from '../../composicao/observador';
import { compraRepository, obterIdentidadeLocal } from '../../composicao/repositorios';
import { completarMesesSemCompra, GastoDoMes } from '../../domain/compra/compra.rules';
import { CompraRepository } from '../../ports/compra.repository';
import { ObservadorDeMudancas } from '../../ports/observador-de-mudancas';

const MESES_DE_HISTORICO = 12;

export type EstadoDoGastoMensal = {
  carregando: boolean;
  meses: GastoDoMes[];
};

function inicioDaJanela(agoraEm: number): number {
  const data = new Date(agoraEm);
  return new Date(data.getFullYear(), data.getMonth() - (MESES_DE_HISTORICO - 1), 1).getTime();
}

function mesDeReferencia(agoraEm: number): string {
  const data = new Date(agoraEm);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Meses sem compra entram com zero (design D6/Open Questions): o eixo do
 * tempo fica contínuo mesmo antes de doze meses de uso real.
 */
export function useGastoMensal(
  compras: CompraRepository = compraRepository,
  observador: ObservadorDeMudancas = observadorDoBanco,
  agora: () => number = Date.now,
): EstadoDoGastoMensal {
  const [meses, setMeses] = useState<GastoDoMes[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(
    async (montado: () => boolean) => {
      const { casaId } = obterIdentidadeLocal();
      const agoraEm = agora();
      const gastos = await compras.gastoPorMes(casaId, inicioDaJanela(agoraEm));
      if (!montado()) {
        return;
      }
      setMeses(completarMesesSemCompra(gastos, mesDeReferencia(agoraEm)));
      setCarregando(false);
    },
    [compras, agora],
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

  return { carregando, meses };
}
