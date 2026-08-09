import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { milesimos } from '../../domain/shared/quantidade';
import { ItemListaBase } from '../../ports/produto.repository';
import { ProdutoRepositorioFalso } from './teste/repositorio-falso';
import { useListaBase } from './use-lista-base';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  produtoRepository: undefined,
}));
jest.mock('../../composicao/lista-base', () => ({ itensDaListaBase: () => [] }));

const BASE: ItemListaBase[] = [
  { nome: 'Arroz', categoria: 'Grãos', unidade: 'pacote', quantidadeNecessaria: milesimos(2000) },
  { nome: 'Feijão', categoria: 'Grãos', unidade: 'pacote', quantidadeNecessaria: milesimos(2000) },
  { nome: 'Sabão', categoria: 'Limpeza', unidade: 'un', quantidadeNecessaria: milesimos(1000) },
];

async function montar(repo: ProdutoRepositorioFalso, itens: ItemListaBase[] = BASE) {
  const { result } = await renderHook(() => useListaBase(repo, itens));
  await waitFor(() => expect(result.current).not.toBeNull());
  return result;
}

afterEach(cleanup);

describe('adoção da lista base', () => {
  it('cria apenas os itens escolhidos', async () => {
    const repo = new ProdutoRepositorioFalso();
    const result = await montar(repo);
    await act(async () => {
      await result.current.adotar(BASE.slice(0, 2));
    });
    expect(repo.produtos.map((p) => p.nome)).toEqual(['Arroz', 'Feijão']);
    expect(repo.produtos.every((p) => p.quantidadeAtual === 0)).toBe(true);
  });

  it('adoção sem nenhum item marcado não cria nada e não falha', async () => {
    const repo = new ProdutoRepositorioFalso();
    const result = await montar(repo);
    let sucesso = false;
    await act(async () => {
      sucesso = await result.current.adotar([]);
    });
    expect(sucesso).toBe(true);
    expect(repo.produtos).toHaveLength(0);
  });

  it('falha na criação em bloco não deixa despensa parcial e permite tentar de novo', async () => {
    const repo = new ProdutoRepositorioFalso();
    jest.spyOn(repo, 'adotarListaBase').mockRejectedValueOnce(new Error('transação abortada'));
    const result = await montar(repo);

    let sucesso = true;
    await act(async () => {
      sucesso = await result.current.adotar(BASE);
    });
    expect(sucesso).toBe(false);
    expect(repo.produtos).toHaveLength(0);
    await waitFor(() => expect(result.current.falhou).toBe(true));

    await act(async () => {
      sucesso = await result.current.adotar(BASE);
    });
    expect(sucesso).toBe(true);
    expect(repo.produtos).toHaveLength(3);
  });
});
