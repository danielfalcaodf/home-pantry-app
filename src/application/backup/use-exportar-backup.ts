import { useCallback, useState } from 'react';

import {
  backupRepository,
  configuracaoRepository,
  obterIdentidadeLocal,
  relogio,
  sistemaDeArquivos,
} from '../../composicao/repositorios';
import { BackupRepository } from '../../ports/backup.repository';
import { ConfiguracaoRepository } from '../../ports/configuracao.repository';
import { SistemaDeArquivos } from '../../ports/sistema-de-arquivos';

export type EstadoExportarBackup = {
  exportando: boolean;
  exportar: () => Promise<void>;
};

function nomeDoArquivo(agora: number): string {
  const data = new Date(agora).toISOString().slice(0, 10);
  return `repor-backup-${data}.json`;
}

// Sem chamada de rede em nenhum passo (montar lê do SQLite local, gravar e
// compartilhar são operações de arquivo do aparelho) — funciona offline por
// construção (task 2.10).
export function useExportarBackup(
  backups: BackupRepository = backupRepository,
  configuracoes: ConfiguracaoRepository = configuracaoRepository,
  arquivos: SistemaDeArquivos = sistemaDeArquivos,
): EstadoExportarBackup {
  const [exportando, setExportando] = useState(false);

  const exportar = useCallback(async () => {
    setExportando(true);
    try {
      const { casaId } = obterIdentidadeLocal();
      const agora = relogio.agora();
      const arquivo = await backups.montar(casaId, agora);
      await arquivos.gravarECompartilhar(nomeDoArquivo(agora), JSON.stringify(arquivo, null, 2));
      await configuracoes.gravar(casaId, 'ultimoBackupEm', String(agora));
    } finally {
      setExportando(false);
    }
  }, [backups, configuracoes, arquivos]);

  return { exportando, exportar };
}
