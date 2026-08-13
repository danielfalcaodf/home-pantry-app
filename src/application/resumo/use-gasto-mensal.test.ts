import { cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { centavos } from '../../domain/shared/dinheiro';
import { CompraRepositorioFalso } from '../lista/teste/repositorio-compra-falso';
import { ObservadorFalso } from '../estoque/teste/repositorio-falso';
import { useGastoMensal } from './use-gasto-mensal';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  compraRepository: undefined,
}));
jest.mock('../../composicao/observador', () => ({ observadorDoBanco: undefined }));

// Fixtures em hora local: o agrupamento mensal é por fuso local (spec
// gasto-mensal), e o TZ da suíte é fixado em jest.tz.js.
const AGORA = new Date(2026, 7, 3).getTime(); // 2026-08-03 local
// Referência estável entre renders — uma arrow function nova a cada
// renderização recriaria `recarregar` e refaria o efeito indefinidamente.
const agoraFixo = () => AGORA;

afterEach(cleanup);

async function montar(compras: CompraRepositorioFalso, observador = new ObservadorFalso()) {
  const { result } = await renderHook(() => useGastoMensal(compras, observador, agoraFixo));
  await waitFor(() => expect(result.current.carregando).toBe(false));
  return { result, observador };
}

async function finalizarComTotal(
  compras: CompraRepositorioFalso,
  finalizadaEm: number,
  totalPago: number,
) {
  const aberta = await compras.abrir('casa-teste', 'usuario-teste', finalizadaEm - 1000);
  if (!aberta.ok) throw new Error('setup');
  await compras.finalizar(
    aberta.valor.id,
    { reposicoes: [], atualizacoesDePreco: [], totalPago: centavos(totalPago) },
    'usuario-teste',
    finalizadaEm,
  );
}

describe('useGastoMensal', () => {
  it('sempre retorna doze meses, do mais recente ao mais antigo', async () => {
    const compras = new CompraRepositorioFalso();
    const { result } = await montar(compras);
    expect(result.current.meses).toHaveLength(12);
    expect(result.current.meses[0].mes).toBe('2026-08');
    expect(result.current.meses[11].mes).toBe('2025-09');
  });

  it('mês com compra real preserva total e contagem; os demais vêm zerados', async () => {
    const compras = new CompraRepositorioFalso();
    await finalizarComTotal(compras, new Date(2026, 6, 10).getTime(), 5000);
    await finalizarComTotal(compras, new Date(2026, 6, 20).getTime(), 3000);

    const { result } = await montar(compras);

    const julho = result.current.meses.find((m) => m.mes === '2026-07');
    expect(julho).toEqual({ mes: '2026-07', totalPago: 8000, qtdCompras: 2 });
    const junho = result.current.meses.find((m) => m.mes === '2026-06');
    expect(junho).toEqual({ mes: '2026-06', totalPago: 0, qtdCompras: 0 });
  });

  it('agrupa pela virada de mês local, minuto a minuto', async () => {
    const compras = new CompraRepositorioFalso();
    await finalizarComTotal(compras, new Date(2026, 6, 31, 23, 59).getTime(), 1000);
    await finalizarComTotal(compras, new Date(2026, 7, 1, 0, 1).getTime(), 2000);

    const { result } = await montar(compras);

    const julho = result.current.meses.find((m) => m.mes === '2026-07');
    expect(julho).toEqual({ mes: '2026-07', totalPago: 1000, qtdCompras: 1 });
    const agosto = result.current.meses.find((m) => m.mes === '2026-08');
    expect(agosto).toEqual({ mes: '2026-08', totalPago: 2000, qtdCompras: 1 });
  });

  // ACHADO-046: compra finalizada sem itens marcados (totalPago zero) precisa
  // entrar na contagem do mês sem distorcer o total pago das demais.
  it('compra finalizada com total zero entra na contagem sem distorcer o total pago', async () => {
    const compras = new CompraRepositorioFalso();
    await finalizarComTotal(compras, new Date(2026, 6, 5).getTime(), 5000);
    await finalizarComTotal(compras, new Date(2026, 6, 10).getTime(), 0);

    const { result } = await montar(compras);

    const julho = result.current.meses.find((m) => m.mes === '2026-07');
    expect(julho).toEqual({ mes: '2026-07', totalPago: 5000, qtdCompras: 2 });
  });

  it('reage a mudanças notificadas pelo observador', async () => {
    const compras = new CompraRepositorioFalso();
    const { result, observador } = await montar(compras);
    expect(result.current.meses[0]).toEqual({ mes: '2026-08', totalPago: 0, qtdCompras: 0 });

    await finalizarComTotal(compras, new Date(2026, 7, 1).getTime(), 1234);
    observador.notificar();

    await waitFor(() =>
      expect(result.current.meses[0]).toEqual({ mes: '2026-08', totalPago: 1234, qtdCompras: 1 }),
    );
  });
});
