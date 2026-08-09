import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { Compra } from '../../domain/compra/compra';
import { centavos } from '../../domain/shared/dinheiro';
import { CompraDoHistorico, CompraRepository } from '../../ports/compra.repository';
import { ObservadorFalso } from '../estoque/teste/repositorio-falso';
import { CompraRepositorioFalso } from '../lista/teste/repositorio-compra-falso';
import { useHistoricoDeCompras } from './use-historico-compras';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  compraRepository: undefined,
}));
jest.mock('../../composicao/observador', () => ({ observadorDoBanco: undefined }));

afterEach(cleanup);

function compra(id: string, finalizadaEm: number): Compra {
  return {
    id,
    casaId: 'casa-teste',
    usuarioId: 'usuario-teste',
    status: 'finalizada',
    valorTotalPago: centavos(1000),
    criadaEm: finalizadaEm - 1000,
    finalizadaEm,
    atualizadoEm: finalizadaEm,
    syncStatus: 'local',
  };
}

/** Simula a paginação por data do repositório real, sem SQLite. */
class CompraRepositorioPaginavel implements Partial<CompraRepository> {
  chamadas: { limite?: number; antesDe?: number }[] = [];

  constructor(private readonly todas: Compra[]) {}

  async listarHistorico(
    _casaId: string,
    opcoes: { limite?: number; antesDe?: number } = {},
  ): Promise<CompraDoHistorico[]> {
    this.chamadas.push(opcoes);
    const { limite = 30, antesDe } = opcoes;
    const restantes =
      antesDe === undefined ? this.todas : this.todas.filter((c) => (c.finalizadaEm as number) < antesDe);
    return restantes.slice(0, limite).map((compra) => ({ compra, qtdItensComprados: 0 }));
  }
}

function montarHistoricoGrande(quantidade: number): Compra[] {
  return Array.from({ length: quantidade }, (_, i) => compra(`c-${quantidade - i}`, 2_000_000 - i));
}

async function montarPaginavel(repo: CompraRepositorioPaginavel) {
  // Instância estável entre renders — uma nova a cada render refaria o
  // efeito indefinidamente (a mesma armadilha de identidade de `agora` em
  // use-gasto-mensal.test.ts).
  const observador = new ObservadorFalso();
  const { result } = await renderHook(() =>
    useHistoricoDeCompras(repo as unknown as CompraRepository, observador),
  );
  await waitFor(() => expect(result.current.carregando).toBe(false));
  return result;
}

describe('useHistoricoDeCompras — paginação', () => {
  it('carrega apenas um bloco recente quando o histórico é grande', async () => {
    const repo = new CompraRepositorioPaginavel(montarHistoricoGrande(80));
    const result = await montarPaginavel(repo);

    expect(result.current.compras).toHaveLength(30);
    expect(result.current.compras[0].compra.id).toBe('c-80'); // o mais recente primeiro
    expect(result.current.temMais).toBe(true);
  });

  it('carregarMais continua a partir da data da última compra, não de um deslocamento (task 4.5)', async () => {
    const repo = new CompraRepositorioPaginavel(montarHistoricoGrande(65));
    const result = await montarPaginavel(repo);

    await act(async () => {
      await result.current.carregarMais();
    });

    expect(result.current.compras).toHaveLength(60);
    expect(repo.chamadas[1]).toEqual(
      expect.objectContaining({ antesDe: montarHistoricoGrande(65)[29].finalizadaEm }),
    );
    expect(repo.chamadas[1]).not.toHaveProperty('deslocamento');
  });

  it('sinaliza que não há mais quando o último bloco vem incompleto', async () => {
    const repo = new CompraRepositorioPaginavel(montarHistoricoGrande(10));
    const result = await montarPaginavel(repo);

    expect(result.current.compras).toHaveLength(10);
    expect(result.current.temMais).toBe(false);
  });

  it('carregarMais não faz nada quando já não há mais páginas', async () => {
    const repo = new CompraRepositorioPaginavel(montarHistoricoGrande(10));
    const result = await montarPaginavel(repo);

    await act(async () => {
      await result.current.carregarMais();
    });

    expect(repo.chamadas).toHaveLength(1);
    expect(result.current.compras).toHaveLength(10);
  });
});

async function montar(compras: CompraRepositorioFalso, observador = new ObservadorFalso()) {
  const { result } = await renderHook(() => useHistoricoDeCompras(compras, observador));
  await waitFor(() => expect(result.current.carregando).toBe(false));
  return { result, observador };
}

async function finalizar(compras: CompraRepositorioFalso, finalizadaEm: number) {
  const aberta = await compras.abrir('casa-teste', 'usuario-teste', finalizadaEm - 1000);
  if (!aberta.ok) throw new Error('setup');
  await compras.finalizar(
    aberta.valor.id,
    { reposicoes: [], atualizacoesDePreco: [], totalPago: centavos(1000) },
    'usuario-teste',
    finalizadaEm,
  );
  return aberta.valor.id;
}

describe('useHistoricoDeCompras', () => {
  it('carrega o primeiro bloco do mais recente ao mais antigo', async () => {
    const compras = new CompraRepositorioFalso();
    await finalizar(compras, 1000);
    await finalizar(compras, 2000);

    const { result } = await montar(compras);

    expect(result.current.compras).toHaveLength(2);
    expect(result.current.compras[0].compra.finalizadaEm).toBe(2000);
  });

  it('reage a mudanças notificadas pelo observador', async () => {
    const compras = new CompraRepositorioFalso();
    const { result, observador } = await montar(compras);
    expect(result.current.compras).toHaveLength(0);

    await finalizar(compras, 1000);
    await act(async () => observador.notificar());

    await waitFor(() => expect(result.current.compras).toHaveLength(1));
  });
});
