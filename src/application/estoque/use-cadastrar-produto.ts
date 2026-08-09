import { useCallback, useState } from 'react';

import { obterIdentidadeLocal, produtoRepository } from '../../composicao/repositorios';
import { Produto } from '../../domain/produto/produto';
import {
  EntradaCadastroProduto,
  ErroValidacaoProduto,
  validarCadastroProduto,
} from '../../domain/produto/validacao';
import { ErroEscritaProduto, ProdutoRepository } from '../../ports/produto.repository';
import { falha, Result } from '../../shared/result';

export type ErroCadastro = ErroValidacaoProduto | { campo: 'nome'; mensagem: string };

export function useCadastrarProduto(repositorio: ProdutoRepository = produtoRepository) {
  const [salvando, setSalvando] = useState(false);

  const cadastrar = useCallback(
    async (entrada: EntradaCadastroProduto): Promise<Result<Produto, ErroCadastro>> => {
      const validado = validarCadastroProduto(entrada);
      if (!validado.ok) {
        return validado;
      }
      setSalvando(true);
      try {
        const { casaId, usuarioId } = obterIdentidadeLocal();
        const criado = await repositorio.criar(casaId, usuarioId, validado.valor);
        if (!criado.ok) {
          return falha(mensagemDeEscrita(criado.erro, validado.valor.nome));
        }
        return criado;
      } finally {
        setSalvando(false);
      }
    },
    [repositorio],
  );

  return { cadastrar, salvando };
}

export function mensagemDeEscrita(erro: ErroEscritaProduto, nome: string): ErroCadastro {
  if (erro === 'nome_duplicado') {
    return { campo: 'nome', mensagem: `Já existe um item chamado ${nome} na sua despensa.` };
  }
  return { campo: 'nome', mensagem: 'Item não encontrado.' };
}
