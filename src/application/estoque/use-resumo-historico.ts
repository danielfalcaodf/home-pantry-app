import { useEffect, useState } from 'react';

import { movimentoRepository } from '../../composicao/repositorios';
import { MovimentoRepository } from '../../ports/movimento.repository';

const DIAS_RECENTES = 30;
const JANELA_MS = DIAS_RECENTES * 24 * 60 * 60 * 1000;
// Bloco generoso o bastante para cobrir 30 dias de uso comum sem paginar —
// é só um resumo do rodapé, não o histórico completo (task 5.10).
const LIMITE_DE_BUSCA = 200;

export type ResumoHistoricoRecente = { carregando: boolean; quantidadeDeUsos: number };

export function useResumoHistoricoRecente(
  produtoId: string,
  repositorio: MovimentoRepository = movimentoRepository,
  agora: () => number = Date.now,
): ResumoHistoricoRecente {
  const [quantidadeDeUsos, setQuantidadeDeUsos] = useState(0);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let montado = true;
    async function carregar() {
      const recentes = await repositorio.historicoPorProduto(produtoId, {
        limite: LIMITE_DE_BUSCA,
      });
      if (!montado) {
        return;
      }
      const limiar = agora() - JANELA_MS;
      setQuantidadeDeUsos(
        recentes.filter((m) => m.tipo === 'baixa' && m.criadoEm >= limiar).length,
      );
      setCarregando(false);
    }
    void carregar();
    return () => {
      montado = false;
    };
  }, [produtoId, repositorio, agora]);

  return { carregando, quantidadeDeUsos };
}
