import { act, cleanup, renderHook } from '@testing-library/react-native';

import { CompraRepositorioFalso } from '../lista/teste/repositorio-compra-falso';
import { useCancelarCompra } from './use-cancelar-compra';

jest.mock('../../composicao/repositorios', () => ({
  relogio: { agora: () => 2000 },
  compraRepository: undefined,
}));

afterEach(cleanup);

describe('useCancelarCompra', () => {
  it('cancela a compra aberta', async () => {
    const compras = new CompraRepositorioFalso();
    const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
    if (!aberta.ok) {
      throw new Error('setup');
    }
    const { result } = await renderHook(() => useCancelarCompra(compras));

    let sucesso = false;
    await act(async () => {
      sucesso = await result.current.cancelar(aberta.valor.id);
    });

    expect(sucesso).toBe(true);
    expect(compras.compras[0].status).toBe('cancelada');
  });

  it('retorna falha quando a compra não existe mais', async () => {
    const compras = new CompraRepositorioFalso();
    const { result } = await renderHook(() => useCancelarCompra(compras));

    let sucesso = true;
    await act(async () => {
      sucesso = await result.current.cancelar('inexistente');
    });

    expect(sucesso).toBe(false);
  });
});
