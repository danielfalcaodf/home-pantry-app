import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { milesimos } from '../../domain/shared/quantidade';
import {
  MovimentoRepositorioFalso,
  ProdutoRepositorioFalso,
  produtoFalso,
} from './teste/repositorio-falso';
import { ehFalha, useDarBaixa } from './use-dar-baixa';
import { useDesfazerMovimento } from './use-desfazer-movimento';
import { useReporPontual } from './use-repor-pontual';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  produtoRepository: undefined,
  movimentoRepository: undefined,
  relogio: { agora: () => 1_700_000_000_000 },
}));

const relogio = { agora: () => 1_700_000_000_000 };

async function montar<T>(callback: () => T) {
  const { result } = await renderHook(callback);
  await waitFor(() => expect(result.current).not.toBeNull());
  return result;
}

afterEach(cleanup);

describe('useDarBaixa', () => {
  it('consumo normal grava o movimento e devolve o saldo', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ quantidadeAtual: milesimos(3000) }),
    ]);
    const result = await montar(() => useDarBaixa(repo, relogio));
    const registro = await result.current.registrar('p1', milesimos(1000));
    expect(ehFalha(registro)).toBe(false);
    if (!ehFalha(registro) && registro.gravou) {
      expect(registro.saldoResultante).toBe(2000);
      expect(registro.zerou).toBe(false);
    }
    expect(repo.produtos[0].quantidadeAtual).toBe(2000);
  });

  it('consumo maior que o saldo fixa em zero e conclui com sucesso', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ quantidadeAtual: milesimos(500) }),
    ]);
    const result = await montar(() => useDarBaixa(repo, relogio));
    const registro = await result.current.registrar('p1', milesimos(2000));
    expect(ehFalha(registro)).toBe(false);
    if (!ehFalha(registro) && registro.gravou) {
      expect(registro.saldoResultante).toBe(0);
      expect(registro.zerou).toBe(true);
    }
    expect(repo.movimentos[0].delta).toBe(-500);
  });

  it('item já zerado não grava movimento nenhum', async () => {
    const repo = new ProdutoRepositorioFalso([produtoFalso({ quantidadeAtual: milesimos(0) })]);
    const result = await montar(() => useDarBaixa(repo, relogio));
    const registro = await result.current.registrar('p1', milesimos(1000));
    expect(registro).toEqual({ gravou: false, motivo: 'estoque_zerado' });
    expect(repo.movimentos).toHaveLength(0);
  });

  it('falha de gravação é sinalizada sem alterar a quantidade', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ quantidadeAtual: milesimos(3000) }),
    ]);
    jest.spyOn(repo, 'darBaixa').mockRejectedValueOnce(new Error('banco indisponível'));
    const result = await montar(() => useDarBaixa(repo, relogio));
    const registro = await result.current.registrar('p1', milesimos(1000));
    expect(ehFalha(registro)).toBe(true);
    expect(repo.produtos[0].quantidadeAtual).toBe(3000);
  });

  it('toques rápidos sucessivos produzem um registro cada, sem agrupar', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ quantidadeAtual: milesimos(5000) }),
    ]);
    const result = await montar(() => useDarBaixa(repo, relogio));
    await act(async () => {
      await Promise.all([
        result.current.registrar('p1', milesimos(1000)),
        result.current.registrar('p1', milesimos(1000)),
        result.current.registrar('p1', milesimos(1000)),
      ]);
    });
    expect(repo.movimentos).toHaveLength(3);
    expect(repo.movimentos.every((m) => m.delta === -1000)).toBe(true);
    expect(repo.produtos[0].quantidadeAtual).toBe(2000);
  });
});

describe('useReporPontual', () => {
  it('reposição soma ao saldo e grava movimento de reposição', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ quantidadeAtual: milesimos(1000) }),
    ]);
    const result = await montar(() => useReporPontual(repo, relogio));
    const registro = await result.current.registrar('p1', milesimos(2000));
    expect(ehFalha(registro)).toBe(false);
    if (!ehFalha(registro) && registro.gravou) {
      expect(registro.saldoResultante).toBe(3000);
    }
    expect(repo.movimentos[0].tipo).toBe('reposicao');
  });

  it('repor sobre item zerado é o caso normal, não erro', async () => {
    const repo = new ProdutoRepositorioFalso([produtoFalso({ quantidadeAtual: milesimos(0) })]);
    const result = await montar(() => useReporPontual(repo, relogio));
    const registro = await result.current.registrar('p1', milesimos(3000));
    expect(ehFalha(registro)).toBe(false);
    expect(repo.produtos[0].quantidadeAtual).toBe(3000);
  });
});

describe('useDesfazerMovimento', () => {
  it('desfaz o movimento descrito, não o último gravado', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ quantidadeAtual: milesimos(5000) }),
    ]);
    const movimentos = new MovimentoRepositorioFalso(repo);
    const baixa = await montar(() => useDarBaixa(repo, relogio));

    const primeiro = await baixa.current.registrar('p1', milesimos(1000));
    await baixa.current.registrar('p1', milesimos(1000));
    await baixa.current.registrar('p1', milesimos(1000));
    expect(repo.produtos[0].quantidadeAtual).toBe(2000);
    if (ehFalha(primeiro) || !primeiro.gravou) {
      throw new Error('setup');
    }

    const desfazer = await montar(() => useDesfazerMovimento(movimentos, relogio));
    const resultado = await desfazer.current.desfazer(primeiro.movimentoId);

    expect(resultado.desfez).toBe(true);
    expect(repo.produtos[0].quantidadeAtual).toBe(3000);
    // O original permanece na trilha; o inverso é um registro novo.
    expect(repo.movimentos.map((m) => m.id)).toContain(primeiro.movimentoId);
    expect(repo.movimentos).toHaveLength(4);
  });

  it('desfazer consumo que zerou volta ao valor real anterior, não ao solicitado', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ quantidadeAtual: milesimos(500) }),
    ]);
    const movimentos = new MovimentoRepositorioFalso(repo);
    const baixa = await montar(() => useDarBaixa(repo, relogio));

    // Pediu 2000, mas só havia 500: a variação aplicada foi -500.
    const registro = await baixa.current.registrar('p1', milesimos(2000));
    if (ehFalha(registro) || !registro.gravou) {
      throw new Error('setup');
    }
    expect(repo.produtos[0].quantidadeAtual).toBe(0);

    const desfazer = await montar(() => useDesfazerMovimento(movimentos, relogio));
    await desfazer.current.desfazer(registro.movimentoId);

    expect(repo.produtos[0].quantidadeAtual).toBe(500);
  });

  it('desfazer movimento inexistente não quebra', async () => {
    const repo = new ProdutoRepositorioFalso([produtoFalso()]);
    const movimentos = new MovimentoRepositorioFalso(repo);
    const desfazer = await montar(() => useDesfazerMovimento(movimentos, relogio));
    expect(await desfazer.current.desfazer('fantasma')).toEqual({ desfez: false });
  });
});
