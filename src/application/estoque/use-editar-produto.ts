import { useCallback, useEffect, useState } from 'react';

import { observadorDoBanco } from '../../composicao/observador';
import { produtoRepository } from '../../composicao/repositorios';
import { Produto } from '../../domain/produto/produto';
import { ProdutoValidado } from '../../domain/produto/validacao';
import { ObservadorDeMudancas } from '../../ports/observador-de-mudancas';
import { ProdutoRepository } from '../../ports/produto.repository';
import { Result } from '../../shared/result';
import { enriquecer, ProdutoNaDespensa } from './use-produtos';
import { ErroCadastro, mensagemDeEscrita } from './use-cadastrar-produto';
import { falha } from '../../shared/result';

export function useProduto(
  id: string,
  repositorio: ProdutoRepository = produtoRepository,
  observador: ObservadorDeMudancas = observadorDoBanco,
): { item: ProdutoNaDespensa | null; carregando: boolean } {
  const [item, setItem] = useState<ProdutoNaDespensa | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(
    async (montado: () => boolean) => {
      const encontrado = await repositorio.obterPorId(id);
      if (!montado()) {
        return;
      }
      setItem(encontrado ? enriquecer(encontrado) : null);
      setCarregando(false);
    },
    [id, repositorio],
  );

  useEffect(() => {
    let montado = true;
    const estaMontado = () => montado;
    void recarregar(estaMontado);
    const cancelarAssinatura = observador.assinar(() => {
      void recarregar(estaMontado);
    });
    return () => {
      montado = false;
      cancelarAssinatura();
    };
  }, [recarregar, observador]);

  return { item, carregando };
}

// Quantidade atual fica de fora: alterá-la gera movimento e é ajuste (D8).
export type CamposEditaveis = Partial<Omit<ProdutoValidado, 'quantidadeAtual'>>;

export function useEditarProduto(repositorio: ProdutoRepository = produtoRepository) {
  const editar = useCallback(
    async (id: string, campos: CamposEditaveis): Promise<Result<Produto, ErroCadastro>> => {
      const editado = await repositorio.editar(id, campos);
      if (!editado.ok) {
        return falha(mensagemDeEscrita(editado.erro, campos.nome ?? ''));
      }
      return editado;
    },
    [repositorio],
  );

  return { editar };
}

export function useRemoverProduto(repositorio: ProdutoRepository = produtoRepository) {
  const remover = useCallback(
    async (id: string) => {
      await repositorio.removerLogicamente(id);
    },
    [repositorio],
  );

  return { remover };
}
