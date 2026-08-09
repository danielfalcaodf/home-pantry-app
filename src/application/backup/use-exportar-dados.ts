import { useCallback, useState } from 'react';

import {
  obterIdentidadeLocal,
  produtoRepository,
  relogio,
  sistemaDeArquivos,
} from '../../composicao/repositorios';
import { gerarCsvDeProdutos } from '../../domain/produto/exportar-csv';
import { ProdutoRepository } from '../../ports/produto.repository';
import { SistemaDeArquivos } from '../../ports/sistema-de-arquivos';

export type EstadoExportarDados = {
  exportando: boolean;
  exportar: () => Promise<void>;
};

function nomeDoArquivo(agora: number): string {
  const data = new Date(agora).toISOString().slice(0, 10);
  return `repor-produtos-${data}.csv`;
}

// Exportação de dados (design D7) — diferente de backup: valores em CSV
// legível, não restaurável. O rótulo distinto vive na tela de
// configurações (seção 6); aqui só a geração e o compartilhamento.
export function useExportarDados(
  produtos: ProdutoRepository = produtoRepository,
  arquivos: SistemaDeArquivos = sistemaDeArquivos,
): EstadoExportarDados {
  const [exportando, setExportando] = useState(false);

  const exportar = useCallback(async () => {
    setExportando(true);
    try {
      const { casaId } = obterIdentidadeLocal();
      const lista = await produtos.listarDespensa(casaId);
      const csv = gerarCsvDeProdutos(lista);
      await arquivos.gravarECompartilhar(nomeDoArquivo(relogio.agora()), csv, 'text/csv');
    } finally {
      setExportando(false);
    }
  }, [produtos, arquivos]);

  return { exportando, exportar };
}
