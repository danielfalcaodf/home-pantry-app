import { useCallback, useEffect, useState } from 'react';

import { observadorDoBanco } from '../../composicao/observador';
import { compraRepository, obterIdentidadeLocal } from '../../composicao/repositorios';
import { CompraRepository } from '../../ports/compra.repository';
import { ObservadorDeMudancas } from '../../ports/observador-de-mudancas';

export type ResumoCompraAberta = {
  compraId: string;
  marcados: number;
  total: number;
  /** Há marcação ou ajuste que "começar nova lista" descartaria. */
  possuiProgresso: boolean;
};

export type EstadoResumoCompraAberta = {
  resumo: ResumoCompraAberta | null;
  carregando: boolean;
};

export function useResumoCompraAberta(
  compras: CompraRepository = compraRepository,
  observador: ObservadorDeMudancas = observadorDoBanco,
): EstadoResumoCompraAberta {
  const [resumo, setResumo] = useState<ResumoCompraAberta | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(
    async (montado: () => boolean) => {
      const { casaId } = obterIdentidadeLocal();
      const aberta = await compras.obterAberta(casaId);
      if (!aberta) {
        if (montado()) {
          setResumo(null);
          setCarregando(false);
        }
        return;
      }
      const itens = (await compras.listarItens(aberta.id)).map(({ item }) => item);
      if (!montado()) {
        return;
      }
      setResumo({
        compraId: aberta.id,
        marcados: itens.filter((item) => item.comprado).length,
        total: itens.length,
        possuiProgresso: itens.some(
          (item) => item.comprado || item.quantidadeComprada !== null || item.valorPagoUnitario !== null,
        ),
      });
      setCarregando(false);
    },
    [compras],
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

  return { resumo, carregando };
}
