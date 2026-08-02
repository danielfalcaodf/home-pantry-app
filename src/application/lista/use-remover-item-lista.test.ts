import { act, cleanup, renderHook } from '@testing-library/react-native';

import { ItemListaProduto } from '../../domain/lista/lista';
import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { CompraRepositorioFalso } from './teste/repositorio-compra-falso';
import { useRemoverItemDaLista } from './use-remover-item-lista';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  relogio: { agora: () => 1000 },
  compraRepository: undefined,
}));

afterEach(cleanup);

const ITEM: ItemListaProduto = {
  tipo: 'produto',
  produtoId: 'p1',
  nome: 'Arroz',
  categoria: 'Grãos',
  unidade: 'pacote',
  quantidadeAComprar: milesimos(2000),
  custo: centavos(1780),
  semPreco: false,
};

describe('useRemoverItemDaLista', () => {
  it('cria a compra aberta sob demanda e marca a exclusão, sem alterar estoque nem produto', async () => {
    const compras = new CompraRepositorioFalso();
    const { result } = await renderHook(() => useRemoverItemDaLista(compras));

    await act(async () => {
      await result.current.remover(ITEM);
    });

    expect(compras.compras).toHaveLength(1);
    expect(compras.itens).toHaveLength(1);
    expect(compras.itens[0]).toMatchObject({ produtoId: 'p1', excluido: true });
    expect(result.current.ultimaRemocao?.nome).toBe('Arroz');
  });

  it('desfazer remove a marcação de exclusão na mesma sessão', async () => {
    const compras = new CompraRepositorioFalso();
    const { result } = await renderHook(() => useRemoverItemDaLista(compras));

    await act(async () => {
      await result.current.remover(ITEM);
    });
    expect(compras.itens).toHaveLength(1);

    await act(async () => {
      await result.current.desfazer();
    });
    expect(compras.itens).toHaveLength(0);
    expect(result.current.ultimaRemocao).toBeNull();
  });

  it('reusa a compra aberta existente ao remover um segundo item', async () => {
    const compras = new CompraRepositorioFalso();
    const { result } = await renderHook(() => useRemoverItemDaLista(compras));

    await act(async () => {
      await result.current.remover(ITEM);
    });
    await act(async () => {
      await result.current.remover({ ...ITEM, produtoId: 'p2', nome: 'Feijão' });
    });

    expect(compras.compras).toHaveLength(1);
    expect(compras.itens).toHaveLength(2);
  });
});
