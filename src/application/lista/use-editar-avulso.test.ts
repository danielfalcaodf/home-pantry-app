import { act, cleanup, renderHook } from '@testing-library/react-native';

import { milesimos } from '../../domain/shared/quantidade';
import { CompraRepositorioFalso } from './teste/repositorio-compra-falso';
import { useEditarAvulso } from './use-editar-avulso';

jest.mock('../../composicao/repositorios', () => ({ compraRepository: undefined }));

afterEach(cleanup);

describe('useEditarAvulso', () => {
  it('edita nome, quantidade, unidade e preço do avulso', async () => {
    const compras = new CompraRepositorioFalso();
    await compras.abrir('casa-1', 'usuario-1', 1);
    const aberta = await compras.obterAberta('casa-1');
    const criado = await compras.adicionarItem(aberta!.id, {
      nomeAvulso: 'Carvão',
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });

    const { result } = await renderHook(() => useEditarAvulso(compras));
    await act(async () => {
      await result.current.editar(criado.id, { nome: 'Carvão premium', unidade: 'kg', quantidade: 2, preco: 20 });
    });

    const editado = compras.itens.find((i) => i.id === criado.id);
    expect(editado).toMatchObject({
      nomeAvulso: 'Carvão premium',
      unidade: 'kg',
      quantidadePlanejada: 2000,
      valorEstimadoUnit: 2000,
    });
  });
});
