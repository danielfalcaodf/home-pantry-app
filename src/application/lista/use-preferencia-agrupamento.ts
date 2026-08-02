import { useCallback, useEffect, useState } from 'react';

import { configuracaoRepository, obterIdentidadeLocal } from '../../composicao/repositorios';
import {
  ConfiguracaoRepository,
  PADROES,
  PreferenciaDeAgrupamento,
} from '../../ports/configuracao.repository';

export type EstadoPreferenciaDeAgrupamento = {
  agrupado: boolean;
  alternar: () => Promise<void>;
};

/**
 * Diferente dos filtros da despensa (efêmeros), o modo corredor é uma
 * preferência de como a pessoa compra — persiste entre aberturas (design D3).
 */
export function usePreferenciaDeAgrupamento(
  repositorio: ConfiguracaoRepository = configuracaoRepository,
): EstadoPreferenciaDeAgrupamento {
  const [preferencia, setPreferencia] = useState<PreferenciaDeAgrupamento>(
    PADROES.agrupamentoDaLista,
  );

  useEffect(() => {
    let ativo = true;
    const { casaId } = obterIdentidadeLocal();
    void repositorio.ler(casaId, 'agrupamentoDaLista').then((salva) => {
      if (ativo) {
        setPreferencia(salva);
      }
    });
    return () => {
      ativo = false;
    };
  }, [repositorio]);

  const alternar = useCallback(async () => {
    const { casaId } = obterIdentidadeLocal();
    const nova: PreferenciaDeAgrupamento = preferencia === 'agrupado' ? 'continuo' : 'agrupado';
    await repositorio.gravar(casaId, 'agrupamentoDaLista', nova);
    setPreferencia(nova);
  }, [repositorio, preferencia]);

  return { agrupado: preferencia === 'agrupado', alternar };
}
