import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { milesimos } from '../../domain/shared/quantidade';
import { MovimentoRepositorioFalso } from './teste/movimento-repositorio-falso';
import { useDiagnostico } from './use-diagnostico';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  relogio: { agora: () => 1_700_000_000_000 },
  movimentoRepository: undefined,
}));

afterEach(cleanup);

describe('useDiagnostico', () => {
  it('começa não verificado, sem divergências', async () => {
    const { result } = await renderHook(() => useDiagnostico(new MovimentoRepositorioFalso()));
    expect(result.current.verificado).toBe(false);
    expect(result.current.divergencias).toEqual([]);
  });

  it('verificar roda a reconciliação da casa local e expõe as divergências', async () => {
    const movimentos = new MovimentoRepositorioFalso();
    movimentos.divergencias = [
      { produtoId: 'p1', nome: 'Arroz', materializado: milesimos(999), calculado: milesimos(0) },
    ];
    const { result } = await renderHook(() => useDiagnostico(movimentos));

    await act(async () => {
      await result.current.verificar();
    });

    expect(movimentos.chamadasReconciliar).toEqual(['casa-teste']);
    expect(result.current.verificado).toBe(true);
    expect(result.current.divergencias).toEqual([
      { produtoId: 'p1', nome: 'Arroz', materializado: 999, calculado: 0 },
    ]);
  });

  it('corrigir grava o ajuste pela soma calculada e remove a divergência da lista, nunca em silêncio', async () => {
    const movimentos = new MovimentoRepositorioFalso();
    movimentos.divergencias = [
      { produtoId: 'p1', nome: 'Arroz', materializado: milesimos(999), calculado: milesimos(0) },
    ];
    const { result } = await renderHook(() => useDiagnostico(movimentos));
    await act(async () => {
      await result.current.verificar();
    });

    await act(async () => {
      await result.current.corrigir('p1');
    });

    expect(movimentos.chamadasCorrigir).toEqual([{ produtoId: 'p1', calculado: 0 }]);
    await waitFor(() => expect(result.current.divergencias).toEqual([]));
  });

  it('corrigir um produtoId sem divergência conhecida não chama o repositório', async () => {
    const movimentos = new MovimentoRepositorioFalso();
    const { result } = await renderHook(() => useDiagnostico(movimentos));

    await act(async () => {
      await result.current.corrigir('fantasma');
    });

    expect(movimentos.chamadasCorrigir).toHaveLength(0);
  });

  it('corrigirTudo corrige todas as divergências de uma vez e limpa a lista', async () => {
    const movimentos = new MovimentoRepositorioFalso();
    movimentos.divergencias = [
      { produtoId: 'p1', nome: 'Arroz', materializado: milesimos(999), calculado: milesimos(0) },
      { produtoId: 'p2', nome: 'Feijão', materializado: milesimos(1), calculado: milesimos(500) },
    ];
    const { result } = await renderHook(() => useDiagnostico(movimentos));
    await act(async () => {
      await result.current.verificar();
    });

    await act(async () => {
      await result.current.corrigirTudo();
    });

    expect(result.current.divergencias).toEqual([]);
  });
});
