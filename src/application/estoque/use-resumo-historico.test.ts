import { renderHook, waitFor } from '@testing-library/react-native';

import { MovimentoEstoque } from '../../domain/movimento/movimento';
import { milesimos } from '../../domain/shared/quantidade';
import { MovimentoRepository } from '../../ports/movimento.repository';
import { useResumoHistoricoRecente } from './use-resumo-historico';

jest.mock('../../composicao/repositorios', () => ({
  movimentoRepository: undefined,
}));

const AGORA = 30 * 24 * 60 * 60 * 1000 * 3; // ponto arbitrário no tempo

function movimento(
  tipo: MovimentoEstoque['tipo'],
  diasAtras: number,
): MovimentoEstoque {
  return {
    id: `m-${diasAtras}-${tipo}`,
    casaId: 'casa-teste',
    produtoId: 'p1',
    usuarioId: 'usuario-teste',
    compraId: null,
    tipo,
    quantidadeDelta: tipo === 'baixa' ? milesimos(-1000) : milesimos(1000),
    quantidadeResultante: milesimos(1000),
    motivo: null,
    criadoEm: AGORA - diasAtras * 24 * 60 * 60 * 1000,
    syncStatus: 'local',
  };
}

function repoCom(historico: MovimentoEstoque[]): MovimentoRepository {
  return {
    historicoPorProduto: async () => historico,
  } as unknown as MovimentoRepository;
}

describe('useResumoHistoricoRecente', () => {
  it('conta apenas usos (baixas) dentro dos últimos 30 dias', async () => {
    const repo = repoCom([
      movimento('baixa', 5),
      movimento('baixa', 29),
      movimento('baixa', 31), // fora da janela
      movimento('reposicao', 1), // não é uso
      movimento('ajuste', 1), // não é uso
    ]);
    const { result } = await renderHook(() =>
      useResumoHistoricoRecente('p1', repo, () => AGORA),
    );
    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.quantidadeDeUsos).toBe(2);
  });

  it('sem histórico recente conta zero', async () => {
    const repo = repoCom([]);
    const { result } = await renderHook(() =>
      useResumoHistoricoRecente('p1', repo, () => AGORA),
    );
    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.quantidadeDeUsos).toBe(0);
  });
});
