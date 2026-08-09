import { useCallback, useEffect, useState } from 'react';

import { observadorDoBanco } from '../../composicao/observador';
import { compraRepository, obterIdentidadeLocal } from '../../composicao/repositorios';
import { dataDeReferencia } from '../../domain/compra/compra.rules';
import { CompraDoHistorico, CompraRepository } from '../../ports/compra.repository';
import { ObservadorDeMudancas } from '../../ports/observador-de-mudancas';

export type { CompraDoHistorico } from '../../ports/compra.repository';

const TAMANHO_DO_BLOCO = 30;

export type EstadoDoHistoricoDeCompras = {
  carregando: boolean;
  compras: CompraDoHistorico[];
  /** Falso quando o último bloco carregado veio menor que o tamanho pedido. */
  temMais: boolean;
  carregarMais: () => Promise<void>;
};

/**
 * Carrega em blocos, continuando pela data de referência da última compra
 * carregada — nunca por deslocamento numérico (design D6, mesmo padrão do
 * histórico do produto).
 */
export function useHistoricoDeCompras(
  compras: CompraRepository = compraRepository,
  observador: ObservadorDeMudancas = observadorDoBanco,
): EstadoDoHistoricoDeCompras {
  const [itens, setItens] = useState<CompraDoHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [temMais, setTemMais] = useState(true);

  const recarregar = useCallback(
    async (montado: () => boolean) => {
      const { casaId } = obterIdentidadeLocal();
      const bloco = await compras.listarHistorico(casaId, { limite: TAMANHO_DO_BLOCO });
      if (!montado()) {
        return;
      }
      setItens(bloco);
      setTemMais(bloco.length === TAMANHO_DO_BLOCO);
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

  const carregarMais = useCallback(async () => {
    const ultima = itens[itens.length - 1];
    if (!ultima || !temMais) {
      return;
    }
    const { casaId } = obterIdentidadeLocal();
    const bloco = await compras.listarHistorico(casaId, {
      limite: TAMANHO_DO_BLOCO,
      antesDe: dataDeReferencia(ultima.compra),
    });
    setItens((atuais) => [...atuais, ...bloco]);
    setTemMais(bloco.length === TAMANHO_DO_BLOCO);
  }, [itens, compras, temMais]);

  return { carregando, compras: itens, temMais, carregarMais };
}
