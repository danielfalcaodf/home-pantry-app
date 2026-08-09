import { useCallback, useEffect, useState } from 'react';

import { configuracaoRepository, obterIdentidadeLocal } from '../../composicao/repositorios';
import {
  ConfiguracaoRepository,
  PADROES,
  PreferenciaDeTema,
} from '../../ports/configuracao.repository';

export type EstadoPreferenciaDeTema = {
  preferencia: PreferenciaDeTema;
  /** Falso até a leitura do SQLite terminar — segure a splash até aqui. */
  carregada: boolean;
  escolher: (nova: PreferenciaDeTema) => Promise<void>;
};

/**
 * @param habilitado só fica verdadeiro depois das migrations — antes disso a
 * tabela de configuração ainda não existe.
 */
export function usePreferenciaDeTemaPersistida(
  habilitado: boolean,
  repositorio: ConfiguracaoRepository = configuracaoRepository,
): EstadoPreferenciaDeTema {
  const [preferencia, setPreferencia] = useState<PreferenciaDeTema>(PADROES.tema);
  const [carregada, setCarregada] = useState(false);

  useEffect(() => {
    if (!habilitado) {
      return;
    }
    let ativo = true;
    const { casaId } = obterIdentidadeLocal();
    void repositorio.ler(casaId, 'tema').then((salva) => {
      if (ativo) {
        setPreferencia(salva);
        setCarregada(true);
      }
    });
    return () => {
      ativo = false;
    };
  }, [habilitado, repositorio]);

  const escolher = useCallback(
    async (nova: PreferenciaDeTema) => {
      const { casaId } = obterIdentidadeLocal();
      await repositorio.gravar(casaId, 'tema', nova);
      setPreferencia(nova);
    },
    [repositorio],
  );

  return { preferencia, carregada, escolher };
}
