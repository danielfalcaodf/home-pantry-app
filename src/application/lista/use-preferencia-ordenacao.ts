import { useCallback, useEffect, useState } from 'react';

import { configuracaoRepository, obterIdentidadeLocal } from '../../composicao/repositorios';
import {
  ConfiguracaoRepository,
  OrdenacaoDaDespensa,
  PADROES,
} from '../../ports/configuracao.repository';

export type { OrdenacaoDaDespensa } from '../../ports/configuracao.repository';

export type EstadoPreferenciaDeOrdenacao = {
  modo: OrdenacaoDaDespensa;
  /** false até a leitura do repositório resolver — evita buscar a despensa
   *  com o padrão antes de saber a preferência real (sem flash de ordem). */
  carregado: boolean;
  selecionar: (modo: OrdenacaoDaDespensa) => Promise<void>;
};

/**
 * Molde estrutural de `usePreferenciaDeAgrupamento`: lê no mount, grava e
 * atualiza estado local a cada escolha (design D3). Com 4 modos possíveis
 * (nome/estado × crescente/decrescente), a escolha vem de um menu, não de
 * um toggle binário — por isso `selecionar(modo)` em vez de `alternar()`.
 */
export function usePreferenciaDeOrdenacao(
  repositorio: ConfiguracaoRepository = configuracaoRepository,
): EstadoPreferenciaDeOrdenacao {
  const [modo, setModo] = useState<OrdenacaoDaDespensa>(PADROES.ordenacaoDaDespensa);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    let ativo = true;
    const { casaId } = obterIdentidadeLocal();
    void repositorio.ler(casaId, 'ordenacaoDaDespensa').then((salvo) => {
      if (ativo) {
        setModo(salvo);
        setCarregado(true);
      }
    });
    return () => {
      ativo = false;
    };
  }, [repositorio]);

  const selecionar = useCallback(
    async (novo: OrdenacaoDaDespensa) => {
      const { casaId } = obterIdentidadeLocal();
      await repositorio.gravar(casaId, 'ordenacaoDaDespensa', novo);
      setModo(novo);
    },
    [repositorio],
  );

  return { modo, carregado, selecionar };
}
