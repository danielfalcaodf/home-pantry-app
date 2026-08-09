import { useCallback, useRef, useState } from 'react';

import { Milesimos } from '../../domain/shared/quantidade';
import { Unidade } from '../../domain/shared/unidade';
import {
  mensagemDeConsumo,
  mensagemDeItemAcabado,
  mensagemDeReposicao,
  MENSAGEM_ESTOQUE_ZERADO,
  MENSAGEM_FALHA_AO_GRAVAR,
} from '../format/mensagem-de-registro';
import { RegistroParaDesfazer } from './toast-desfazer';

export type ResultadoDeRegistro =
  | { gravou: true; movimentoId: string; zerou: boolean }
  | { gravou: false; motivo: 'estoque_zerado' | 'nao_encontrado' }
  | { erro: true };

export type ItemRegistrado = { nome: string; unidade: Unidade };

/**
 * Traduz o resultado do caso de uso para a confirmação visível — e é o único
 * lugar que decide qual texto o usuário lê. Sem isso, cada tela inventaria o
 * seu, e o vocabulário divergiria.
 */
export function useRegistroDeConsumo() {
  const [registro, setRegistro] = useState<RegistroParaDesfazer | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const ultimaTentativa = useRef<(() => void) | null>(null);

  const limpar = useCallback(() => {
    setRegistro(null);
    setAviso(null);
  }, []);

  const anunciar = useCallback(
    (
      resultado: ResultadoDeRegistro,
      item: ItemRegistrado,
      quantidade: Milesimos,
      tipo: 'consumo' | 'reposicao',
      tentarNovamente?: () => void,
    ) => {
      if ('erro' in resultado) {
        ultimaTentativa.current = tentarNovamente ?? null;
        setRegistro(null);
        setAviso(MENSAGEM_FALHA_AO_GRAVAR);
        return;
      }
      if (!resultado.gravou) {
        setRegistro(null);
        setAviso(
          resultado.motivo === 'estoque_zerado' ? MENSAGEM_ESTOQUE_ZERADO : MENSAGEM_FALHA_AO_GRAVAR,
        );
        return;
      }
      setAviso(resultado.zerou ? mensagemDeItemAcabado(item.nome) : null);
      setRegistro({
        movimentoId: resultado.movimentoId,
        mensagem:
          tipo === 'consumo'
            ? mensagemDeConsumo(item.nome, quantidade, item.unidade)
            : mensagemDeReposicao(item.nome, quantidade, item.unidade),
      });
    },
    [],
  );

  return { registro, aviso, anunciar, limpar, tentarNovamente: ultimaTentativa };
}
