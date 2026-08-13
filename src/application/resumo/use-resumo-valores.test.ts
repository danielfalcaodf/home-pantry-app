import { cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { ObservadorFalso, produtoFalso, ProdutoRepositorioFalso } from '../estoque/teste/repositorio-falso';
import { useResumoDeValores } from './use-resumo-valores';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  produtoRepository: undefined,
}));
jest.mock('../../composicao/observador', () => ({ observadorDoBanco: undefined }));

afterEach(cleanup);

async function montar(produtos: ProdutoRepositorioFalso, observador = new ObservadorFalso()) {
  const { result } = await renderHook(() => useResumoDeValores(produtos, observador));
  await waitFor(() => expect(result.current.carregando).toBe(false));
  return { result, observador };
}

describe('useResumoDeValores', () => {
  it('despensa conhecida: dois itens de valores dados produzem o valor do estoque exato (task 1.6)', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({
        id: 'p1',
        nome: 'Arroz',
        quantidadeAtual: milesimos(2000),
        quantidadeNecessaria: milesimos(2000),
        valorUnitario: centavos(1290),
      }),
      produtoFalso({
        id: 'p2',
        nome: 'Café',
        quantidadeAtual: milesimos(3000),
        quantidadeNecessaria: milesimos(3000),
        valorUnitario: centavos(2250),
      }),
    ]);

    const { result } = await montar(produtos);

    expect(result.current.valorDoEstoque).toBe(9330); // R$ 93,30, não R$ 93.300,00
  });

  it('os dois valores nunca são a mesma referência somada (design D2)', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({
        id: 'p1',
        nome: 'Arroz',
        quantidadeAtual: milesimos(1000),
        quantidadeNecessaria: milesimos(3000),
        valorUnitario: centavos(1000),
      }),
    ]);
    const { result } = await montar(produtos);

    // Estoque: 1000 milésimos a 1000 centavos = 1000. Lista: falta 2000 a 1000 = 2000.
    expect(result.current.valorDoEstoque).toBe(1000);
    expect(result.current.valorDaLista).toBe(2000);
  });

  it('produto removido logicamente e produto sem preço não invalidam os totais (task 1.7)', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({
        id: 'p1',
        nome: 'Arroz',
        quantidadeAtual: milesimos(2000),
        quantidadeNecessaria: milesimos(2000),
        valorUnitario: centavos(1290),
      }),
      produtoFalso({
        id: 'p2',
        nome: 'Removido',
        quantidadeAtual: milesimos(5000),
        quantidadeNecessaria: milesimos(5000),
        valorUnitario: centavos(9999),
        deletadoEm: 1,
      }),
      produtoFalso({
        id: 'p3',
        nome: 'Detergente',
        quantidadeAtual: milesimos(0),
        quantidadeNecessaria: milesimos(1000),
        valorUnitario: centavos(0),
      }),
    ]);

    const { result } = await montar(produtos);

    expect(result.current.valorDoEstoque).toBe(2000 * 1290 / 1000);
    expect(result.current.contagemSemPrecoEstoque).toBe(1); // Detergente
    expect(result.current.valorDaLista).toBe(0); // Detergente sem preço
    expect(result.current.contagemSemPrecoLista).toBe(1);
  });

  it('contagens por estado batem com a despensa (critico/emFalta/ok)', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', quantidadeAtual: milesimos(0), quantidadeNecessaria: milesimos(1000) }),
      produtoFalso({ id: 'p2', quantidadeAtual: milesimos(500), quantidadeNecessaria: milesimos(1000) }),
      produtoFalso({ id: 'p3', quantidadeAtual: milesimos(1000), quantidadeNecessaria: milesimos(1000) }),
      produtoFalso({ id: 'p4', quantidadeAtual: milesimos(2000), quantidadeNecessaria: milesimos(1000) }),
    ]);

    const { result } = await montar(produtos);

    expect(result.current.contagensPorEstado).toEqual({ critico: 1, emFalta: 1, ok: 2 });
  });

  it('contagem por estado reage a mudanças do observador sem remontar (ACHADO-050)', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', quantidadeAtual: milesimos(1000), quantidadeNecessaria: milesimos(1000) }),
    ]);
    const { result, observador } = await montar(produtos);
    expect(result.current.contagensPorEstado).toEqual({ critico: 0, emFalta: 0, ok: 1 });
    expect(result.current.itensDaDespensaPorEstado).toEqual([
      { produto: { id: 'p1', nome: 'Arroz', categoria: 'Grãos' }, estado: 'ok' },
    ]);

    // O mesmo item zera e passa a 'critico' — nenhum unmount/remount no meio.
    produtos.produtos[0] = { ...produtos.produtos[0], quantidadeAtual: milesimos(0) };
    observador.notificar();

    await waitFor(() =>
      expect(result.current.contagensPorEstado).toEqual({ critico: 1, emFalta: 0, ok: 0 }),
    );
    expect(result.current.itensDaDespensaPorEstado).toEqual([
      { produto: { id: 'p1', nome: 'Arroz', categoria: 'Grãos' }, estado: 'critico' },
    ]);
  });

  it('reage a mudanças notificadas pelo observador', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({
        id: 'p1',
        quantidadeAtual: milesimos(1000),
        quantidadeNecessaria: milesimos(1000),
        valorUnitario: centavos(500),
      }),
    ]);
    const { result, observador } = await montar(produtos);
    expect(result.current.valorDoEstoque).toBe(500);

    produtos.produtos[0] = { ...produtos.produtos[0], quantidadeAtual: milesimos(2000) };
    observador.notificar();
    await waitFor(() => expect(result.current.valorDoEstoque).toBe(1000));
  });
});
