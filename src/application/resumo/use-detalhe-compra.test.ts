import { cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { produtoFalso, ProdutoRepositorioFalso } from '../estoque/teste/repositorio-falso';
import { CompraRepositorioFalso } from '../lista/teste/repositorio-compra-falso';
import { useDetalheDaCompra } from './use-detalhe-compra';

jest.mock('../../composicao/repositorios', () => ({
  compraRepository: undefined,
}));

afterEach(cleanup);

async function montar(compraId: string, compras: CompraRepositorioFalso) {
  const { result } = await renderHook(() => useDetalheDaCompra(compraId, compras));
  await waitFor(() => expect(result.current.carregando).toBe(false));
  return result;
}

describe('useDetalheDaCompra', () => {
  it('carrega a compra e os itens já com o produto trazido pela junção', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', nome: 'Arroz', valorUnitario: centavos(500) }),
    ]);
    const compras = new CompraRepositorioFalso(produtos);
    const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1);
    if (!aberta.ok) throw new Error('setup');
    await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p1',
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });
    await compras.finalizar(
      aberta.valor.id,
      { reposicoes: [], atualizacoesDePreco: [], totalPago: centavos(500) },
      'usuario-teste',
      2000,
    );

    const result = await montar(aberta.valor.id, compras);

    expect(result.current.compra?.id).toBe(aberta.valor.id);
    expect(result.current.itens).toHaveLength(1);
    expect(result.current.itens[0].produto?.nome).toBe('Arroz');
  });

  it('compra inexistente resulta em compra null, sem lançar', async () => {
    const compras = new CompraRepositorioFalso();
    const result = await montar('inexistente', compras);

    expect(result.current.compra).toBeNull();
    expect(result.current.itens).toEqual([]);
  });

  it('item avulso aparece com produto null', async () => {
    const compras = new CompraRepositorioFalso();
    const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1);
    if (!aberta.ok) throw new Error('setup');
    await compras.adicionarItem(aberta.valor.id, {
      nomeAvulso: 'Pilha AA',
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });

    const result = await montar(aberta.valor.id, compras);

    expect(result.current.itens[0].produto).toBeNull();
    expect(result.current.itens[0].item.nomeAvulso).toBe('Pilha AA');
  });
});
