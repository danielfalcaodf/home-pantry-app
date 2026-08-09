import { useCallback, useEffect, useState } from 'react';

import { configuracaoRepository, obterIdentidadeLocal } from '../../composicao/repositorios';
import { ConfiguracaoRepository } from '../../ports/configuracao.repository';

export type EstadoUltimoBackup = {
  /** '' quando nunca houve backup — mesmo padrão de PADROES.ultimoBackupEm. */
  ultimoBackupEm: string;
  recarregar: () => Promise<void>;
};

// Task 6.6: a tela de configurações informa quando foi o último backup, ou
// convida a fazer o primeiro quando nunca houve.
export function useUltimoBackup(
  configuracoes: ConfiguracaoRepository = configuracaoRepository,
): EstadoUltimoBackup {
  const [ultimoBackupEm, setUltimoBackupEm] = useState('');

  const recarregar = useCallback(async () => {
    const { casaId } = obterIdentidadeLocal();
    setUltimoBackupEm(await configuracoes.ler(casaId, 'ultimoBackupEm'));
  }, [configuracoes]);

  useEffect(() => {
    const { casaId } = obterIdentidadeLocal();
    void configuracoes.ler(casaId, 'ultimoBackupEm').then(setUltimoBackupEm);
  }, [configuracoes]);

  return { ultimoBackupEm, recarregar };
}
