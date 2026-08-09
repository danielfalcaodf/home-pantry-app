import { useCallback, useEffect, useState } from 'react';

import { MovimentoEstoque } from '../../domain/movimento/movimento';
import { movimentoRepository } from '../../composicao/repositorios';
import { MovimentoRepository } from '../../ports/movimento.repository';

const TAMANHO_DO_BLOCO = 30;

export type EstadoDoHistorico = {
  carregando: boolean;
  itens: MovimentoEstoque[];
  /** Falso quando o último bloco carregado veio menor que o tamanho pedido. */
  temMais: boolean;
  carregarMais: () => Promise<void>;
};

/**
 * Carrega em blocos (task 5.8), continuando pela data do último item
 * carregado — nunca por deslocamento numérico (design D7, task 5.9).
 */
export function useHistoricoDoProduto(
  produtoId: string,
  repositorio: MovimentoRepository = movimentoRepository,
): EstadoDoHistorico {
  const [itens, setItens] = useState<MovimentoEstoque[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [temMais, setTemMais] = useState(true);

  useEffect(() => {
    let montado = true;
    async function carregarPrimeiroBloco() {
      const bloco = await repositorio.historicoPorProduto(produtoId, {
        limite: TAMANHO_DO_BLOCO,
      });
      if (!montado) {
        return;
      }
      setItens(bloco);
      setTemMais(bloco.length === TAMANHO_DO_BLOCO);
      setCarregando(false);
    }
    void carregarPrimeiroBloco();
    return () => {
      montado = false;
    };
  }, [produtoId, repositorio]);

  const carregarMais = useCallback(async () => {
    const ultimo = itens[itens.length - 1];
    if (!ultimo || !temMais) {
      return;
    }
    const bloco = await repositorio.historicoPorProduto(produtoId, {
      limite: TAMANHO_DO_BLOCO,
      antesDe: ultimo.criadoEm,
    });
    setItens((atuais) => [...atuais, ...bloco]);
    setTemMais(bloco.length === TAMANHO_DO_BLOCO);
  }, [itens, produtoId, repositorio, temMais]);

  return { carregando, itens, temMais, carregarMais };
}
