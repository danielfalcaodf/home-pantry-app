import { useCallback, useState } from 'react';

import { movimentoRepository, obterIdentidadeLocal, relogio } from '../../composicao/repositorios';
import { DivergenciaReconciliacao, MovimentoRepository } from '../../ports/movimento.repository';

export type EstadoDiagnostico = {
  verificando: boolean;
  /** Falso até a primeira verificação — não confundir com "zero divergências". */
  verificado: boolean;
  divergencias: DivergenciaReconciliacao[];
  verificar: () => Promise<void>;
  /** Corrige pela soma dos movimentos (`calculado`) — nunca em silêncio: grava um movimento de ajuste (task 4.4). */
  corrigir: (produtoId: string) => Promise<void>;
};

// Ação de diagnóstico sob demanda nas configurações (task 4.5) — a mesma
// consulta que roda automaticamente ao final de toda restauração
// (use-restaurar-backup.ts), aqui disponível a qualquer momento.
export function useDiagnostico(
  movimentos: MovimentoRepository = movimentoRepository,
): EstadoDiagnostico {
  const [verificando, setVerificando] = useState(false);
  const [verificado, setVerificado] = useState(false);
  const [divergencias, setDivergencias] = useState<DivergenciaReconciliacao[]>([]);

  const verificar = useCallback(async () => {
    setVerificando(true);
    try {
      const { casaId } = obterIdentidadeLocal();
      setDivergencias(await movimentos.reconciliar(casaId));
      setVerificado(true);
    } finally {
      setVerificando(false);
    }
  }, [movimentos]);

  const corrigir = useCallback(
    async (produtoId: string) => {
      const divergencia = divergencias.find((d) => d.produtoId === produtoId);
      if (!divergencia) {
        return;
      }
      const { usuarioId } = obterIdentidadeLocal();
      const resultado = await movimentos.corrigirDivergencia(
        produtoId,
        usuarioId,
        divergencia.calculado,
        relogio.agora(),
      );
      if (resultado.ok) {
        setDivergencias((atuais) => atuais.filter((d) => d.produtoId !== produtoId));
      }
    },
    [divergencias, movimentos],
  );

  return { verificando, verificado, divergencias, verificar, corrigir };
}
