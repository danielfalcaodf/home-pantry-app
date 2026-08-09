import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { MovimentoEstoque } from '../../domain/movimento/movimento';
import { milesimos } from '../../domain/shared/quantidade';
import { MovimentoRepository } from '../../ports/movimento.repository';
import { useHistoricoDoProduto } from './use-historico';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  movimentoRepository: undefined,
}));

function movimento(id: string, criadoEm: number): MovimentoEstoque {
  return {
    id,
    casaId: 'casa-teste',
    produtoId: 'p1',
    usuarioId: 'usuario-teste',
    compraId: null,
    tipo: 'baixa',
    quantidadeDelta: milesimos(-1000),
    quantidadeResultante: milesimos(1000),
    motivo: null,
    criadoEm,
    syncStatus: 'local',
  };
}

/** Simula a paginação por data do repositório real, sem SQLite. */
class MovimentoRepositorioPaginavel implements Partial<MovimentoRepository> {
  chamadas: { limite?: number; antesDe?: number }[] = [];

  constructor(private readonly todos: MovimentoEstoque[]) {}

  async historicoPorProduto(
    _produtoId: string,
    opcoes: { limite?: number; antesDe?: number } = {},
  ): Promise<MovimentoEstoque[]> {
    this.chamadas.push(opcoes);
    const { limite = 30, antesDe } = opcoes;
    const restantes =
      antesDe === undefined ? this.todos : this.todos.filter((m) => m.criadoEm < antesDe);
    return restantes.slice(0, limite);
  }
}

function montarHistoricoGrande(quantidade: number): MovimentoEstoque[] {
  // Do mais recente para o mais antigo, como a consulta real devolve.
  return Array.from({ length: quantidade }, (_, i) =>
    movimento(`m-${quantidade - i}`, 2_000_000 - i),
  );
}

async function montar(repo: MovimentoRepositorioPaginavel, produtoId = 'p1') {
  const { result } = await renderHook(() =>
    useHistoricoDoProduto(produtoId, repo as unknown as MovimentoRepository),
  );
  await waitFor(() => expect(result.current.carregando).toBe(false));
  return result;
}

afterEach(cleanup);

describe('useHistoricoDoProduto', () => {
  it('carrega apenas um bloco recente quando o histórico é grande (task 5.11)', async () => {
    const repo = new MovimentoRepositorioPaginavel(montarHistoricoGrande(500));
    const result = await montar(repo);

    expect(result.current.itens).toHaveLength(30);
    expect(result.current.itens[0].id).toBe('m-500'); // o mais recente primeiro
    expect(result.current.temMais).toBe(true);
  });

  it('carregarMais continua a partir da data do último item, não de um deslocamento', async () => {
    const repo = new MovimentoRepositorioPaginavel(montarHistoricoGrande(65));
    const result = await montar(repo);

    await act(async () => {
      await result.current.carregarMais();
    });

    expect(result.current.itens).toHaveLength(60);
    expect(repo.chamadas[1]).toEqual(
      expect.objectContaining({ antesDe: montarHistoricoGrande(65)[29].criadoEm }),
    );
    expect(repo.chamadas[1]).not.toHaveProperty('deslocamento');
  });

  it('sinaliza que não há mais quando o último bloco vem incompleto', async () => {
    const repo = new MovimentoRepositorioPaginavel(montarHistoricoGrande(10));
    const result = await montar(repo);

    expect(result.current.itens).toHaveLength(10);
    expect(result.current.temMais).toBe(false);
  });

  it('carregarMais não faz nada quando já não há mais páginas', async () => {
    const repo = new MovimentoRepositorioPaginavel(montarHistoricoGrande(10));
    const result = await montar(repo);

    await act(async () => {
      await result.current.carregarMais();
    });

    expect(repo.chamadas).toHaveLength(1);
    expect(result.current.itens).toHaveLength(10);
  });
});
