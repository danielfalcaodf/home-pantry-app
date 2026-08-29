import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { ObservadorFalso, produtoFalso, ProdutoRepositorioFalso } from '../estoque/teste/repositorio-falso';
import { CompraRepositorioFalso } from '../lista/teste/repositorio-compra-falso';
import { useResumoCompraAberta } from './use-resumo-compra-aberta';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  compraRepository: undefined,
}));
jest.mock('../../composicao/observador', () => ({ observadorDoBanco: undefined }));

afterEach(cleanup);

describe('useResumoCompraAberta', () => {
  it('retorna null quando não existe compra aberta', async () => {
    const compras = new CompraRepositorioFalso();
    const observador = new ObservadorFalso();
    const { result } = await renderHook(() => useResumoCompraAberta(compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    expect(result.current.resumo).toBeNull();
  });

  it('expõe o progresso da compra aberta: total de itens e quantos já foram marcados', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', nome: 'Arroz', valorUnitario: centavos(890) }),
    ]);
    const compras = new CompraRepositorioFalso(produtos);
    const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
    if (!aberta.ok) {
      throw new Error('setup');
    }
    const item1 = await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p1', unidade: 'un', quantidadePlanejada: milesimos(1000),
    });
    await compras.adicionarItem(aberta.valor.id, {
      nomeAvulso: 'Pilha', unidade: 'un', quantidadePlanejada: milesimos(1000),
    });
    await compras.editarItem(item1.id, { comprado: true, quantidadeComprada: milesimos(1000) });
    const observador = new ObservadorFalso();

    const { result } = await renderHook(() => useResumoCompraAberta(compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    expect(result.current.resumo).toEqual({
      compraId: aberta.valor.id,
      marcados: 1,
      total: 2,
      possuiProgresso: true,
    });
  });

  it('possuiProgresso é falso sem nenhum item marcado nem ajustado', async () => {
    const compras = new CompraRepositorioFalso();
    const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
    if (!aberta.ok) {
      throw new Error('setup');
    }
    await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p1', unidade: 'un', quantidadePlanejada: milesimos(1000),
    });
    const observador = new ObservadorFalso();

    const { result } = await renderHook(() => useResumoCompraAberta(compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    expect(result.current.resumo?.possuiProgresso).toBe(false);
  });

  it('possuiProgresso é verdadeiro quando um item não marcado tem quantidade ou preço ajustados', async () => {
    const compras = new CompraRepositorioFalso();
    const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
    if (!aberta.ok) {
      throw new Error('setup');
    }
    const item = await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p1', unidade: 'un', quantidadePlanejada: milesimos(1000),
    });
    await compras.editarItem(item.id, { quantidadeComprada: milesimos(2000) });
    const observador = new ObservadorFalso();

    const { result } = await renderHook(() => useResumoCompraAberta(compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    expect(result.current.resumo?.possuiProgresso).toBe(true);
  });

  it('reage a notificações do observador', async () => {
    const compras = new CompraRepositorioFalso();
    const observador = new ObservadorFalso();
    const { result } = await renderHook(() => useResumoCompraAberta(compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.resumo).toBeNull();

    await compras.abrir('casa-teste', 'usuario-teste', 1000);
    await act(async () => {
      observador.notificar();
    });

    await waitFor(() => expect(result.current.resumo).not.toBeNull());
  });
});
