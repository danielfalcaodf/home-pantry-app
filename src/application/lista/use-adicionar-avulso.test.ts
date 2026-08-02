import { act, cleanup, renderHook } from '@testing-library/react-native';

import { CompraRepositorioFalso } from './teste/repositorio-compra-falso';
import { useAdicionarAvulso } from './use-adicionar-avulso';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  relogio: { agora: () => 1000 },
  compraRepository: undefined,
}));

afterEach(cleanup);

describe('useAdicionarAvulso', () => {
  it('cria a compra aberta sob demanda no primeiro avulso', async () => {
    const compras = new CompraRepositorioFalso();
    const { result } = await renderHook(() => useAdicionarAvulso(compras));

    await act(async () => {
      await result.current.adicionar({ nome: 'Carvão', unidade: 'un', quantidade: 1, preco: 18 });
    });

    expect(compras.compras).toHaveLength(1);
    expect(compras.itens).toHaveLength(1);
    expect(compras.itens[0]).toMatchObject({ nomeAvulso: 'Carvão', valorEstimadoUnit: 1800 });
  });

  it('reusa a compra aberta existente em adições subsequentes', async () => {
    const compras = new CompraRepositorioFalso();
    const { result } = await renderHook(() => useAdicionarAvulso(compras));

    await act(async () => {
      await result.current.adicionar({ nome: 'Carvão', unidade: 'un', quantidade: 1, preco: null });
    });
    await act(async () => {
      await result.current.adicionar({ nome: 'Isqueiro', unidade: 'un', quantidade: 1, preco: null });
    });

    expect(compras.compras).toHaveLength(1);
    expect(compras.itens).toHaveLength(2);
  });

  it('avulso sem preço entra com custo zero', async () => {
    const compras = new CompraRepositorioFalso();
    const { result } = await renderHook(() => useAdicionarAvulso(compras));

    await act(async () => {
      await result.current.adicionar({ nome: 'Gelo', unidade: 'un', quantidade: 2, preco: null });
    });

    expect(compras.itens[0].valorEstimadoUnit).toBe(0);
  });
});
