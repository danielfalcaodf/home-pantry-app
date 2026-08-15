import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { ObservadorFalso, produtoFalso, ProdutoRepositorioFalso } from '../estoque/teste/repositorio-falso';
import { CompraRepositorioFalso } from './teste/repositorio-compra-falso';
import { useListaDeCompras } from './use-lista-compras';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  produtoRepository: undefined,
  compraRepository: undefined,
}));
jest.mock('../../composicao/observador', () => ({ observadorDoBanco: undefined }));

afterEach(cleanup);

async function montar(produtos: ProdutoRepositorioFalso, compras: CompraRepositorioFalso, observador = new ObservadorFalso()) {
  const { result } = await renderHook(() => useListaDeCompras(produtos, compras, observador));
  await waitFor(() => expect(result.current.carregando).toBe(false));
  return { result, observador };
}

describe('useListaDeCompras', () => {
  it('compõe faltantes e avulsos da compra aberta', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', nome: 'Arroz', quantidadeAtual: milesimos(0), quantidadeNecessaria: milesimos(2000) }),
      produtoFalso({ id: 'p2', nome: 'Sabão', quantidadeAtual: milesimos(3000), quantidadeNecessaria: milesimos(2000) }),
    ]);
    const compras = new CompraRepositorioFalso(produtos);
    await compras.abrir('casa-teste', 'usuario-teste', 1);
    const aberta = await compras.obterAberta('casa-teste');
    await compras.adicionarItem(aberta!.id, {
      nomeAvulso: 'Carvão',
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });

    const { result } = await montar(produtos, compras);
    expect(result.current.itens).toHaveLength(2);
    expect(result.current.itens.map((i) => i.nome)).toEqual(['Arroz', 'Carvão']);
  });

  it('item reposto sai automaticamente da lista quando a despensa notifica', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', nome: 'Arroz', quantidadeAtual: milesimos(0), quantidadeNecessaria: milesimos(2000) }),
    ]);
    const compras = new CompraRepositorioFalso(produtos);
    const { result, observador } = await montar(produtos, compras);
    expect(result.current.itens).toHaveLength(1);

    produtos.produtos[0] = { ...produtos.produtos[0], quantidadeAtual: milesimos(2000) };
    await act(async () => observador.notificar());
    await waitFor(() => expect(result.current.itens).toHaveLength(0));
  });

  it('faltante marcado como excluído na compra aberta não aparece na lista', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', nome: 'Arroz', quantidadeAtual: milesimos(0), quantidadeNecessaria: milesimos(2000) }),
      produtoFalso({ id: 'p2', nome: 'Sabão', quantidadeAtual: milesimos(0), quantidadeNecessaria: milesimos(1000) }),
    ]);
    const compras = new CompraRepositorioFalso(produtos);
    await compras.abrir('casa-teste', 'usuario-teste', 1);
    const aberta = await compras.obterAberta('casa-teste');
    await compras.adicionarItem(aberta!.id, {
      produtoId: 'p1',
      unidade: 'pacote',
      quantidadePlanejada: milesimos(1000),
      excluido: true,
    });

    const { result } = await montar(produtos, compras);
    expect(result.current.itens.map((i) => i.nome)).toEqual(['Sabão']);
  });

  // ACHADO de usabilidade: exclusão não é invisível — a pessoa precisa ver
  // o que ficou de fora pra poder trazer de volta manualmente.
  it('faltante excluído aparece em desativados, com o nome do produto', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', nome: 'Arroz', categoria: 'Grãos', quantidadeAtual: milesimos(0), quantidadeNecessaria: milesimos(2000) }),
    ]);
    const compras = new CompraRepositorioFalso(produtos);
    await compras.abrir('casa-teste', 'usuario-teste', 1);
    const aberta = await compras.obterAberta('casa-teste');
    const excluido = await compras.adicionarItem(aberta!.id, {
      produtoId: 'p1',
      unidade: 'pacote',
      quantidadePlanejada: milesimos(1000),
      excluido: true,
    });

    const { result } = await montar(produtos, compras);
    expect(result.current.desativados).toEqual([
      { itemId: excluido.id, produtoId: 'p1', nome: 'Arroz', categoria: 'Grãos' },
    ]);
  });

  it('sem compra aberta, desativados vem vazio', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', quantidadeAtual: milesimos(0), quantidadeNecessaria: milesimos(2000) }),
    ]);
    const compras = new CompraRepositorioFalso(produtos);
    const { result } = await montar(produtos, compras);
    expect(result.current.desativados).toEqual([]);
  });

  it('lista vazia quando nada falta e não há avulso', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', quantidadeAtual: milesimos(2000), quantidadeNecessaria: milesimos(2000) }),
    ]);
    const compras = new CompraRepositorioFalso(produtos);
    const { result } = await montar(produtos, compras);
    expect(result.current.itens).toEqual([]);
  });

  it('usa a quantidade e o custo já arredondados na composição', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({
        id: 'p1',
        nome: 'Café',
        unidade: 'pacote',
        quantidadeAtual: milesimos(500),
        quantidadeNecessaria: milesimos(1000),
        valorUnitario: centavos(1000),
      }),
    ]);
    const compras = new CompraRepositorioFalso(produtos);
    const { result } = await montar(produtos, compras);
    expect(result.current.itens[0].quantidadeAComprar).toBe(1000);
    expect(result.current.itens[0].custo).toBe(1000);
  });

  it('permanece derivada dos faltantes mesmo depois de a compra ser iniciada (materializada)', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', nome: 'Arroz', quantidadeAtual: milesimos(0), quantidadeNecessaria: milesimos(2000) }),
    ]);
    const compras = new CompraRepositorioFalso(produtos);
    const { result } = await montar(produtos, compras);
    expect(result.current.itens).toHaveLength(1);

    // "iniciar compra": materializa o faltante como compra_item planejado.
    const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1);
    if (!aberta.ok) {
      throw new Error('setup');
    }
    await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p1',
      unidade: 'pacote',
      quantidadePlanejada: milesimos(2000),
      valorEstimadoUnit: centavos(0),
    });

    // A lista continua vindo de listarFaltantes, não do item materializado.
    const { result: depois } = await montar(produtos, compras);
    expect(depois.current.itens).toHaveLength(1);
    expect(depois.current.itens[0].nome).toBe('Arroz');
  });
});
