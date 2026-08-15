import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { CompraRepositorioFalso } from '../lista/teste/repositorio-compra-falso';
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
  compraRepository: undefined,
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
    const result = await montar(() => useDarBaixa(repo, relogio, new CompraRepositorioFalso()));
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
    const result = await montar(() => useDarBaixa(repo, relogio, new CompraRepositorioFalso()));
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
    const result = await montar(() => useDarBaixa(repo, relogio, new CompraRepositorioFalso()));
    const registro = await result.current.registrar('p1', milesimos(1000));
    expect(registro).toEqual({ gravou: false, motivo: 'estoque_zerado' });
    expect(repo.movimentos).toHaveLength(0);
  });

  it('falha de gravação é sinalizada sem alterar a quantidade', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ quantidadeAtual: milesimos(3000) }),
    ]);
    jest.spyOn(repo, 'darBaixa').mockRejectedValueOnce(new Error('banco indisponível'));
    const result = await montar(() => useDarBaixa(repo, relogio, new CompraRepositorioFalso()));
    const registro = await result.current.registrar('p1', milesimos(1000));
    expect(ehFalha(registro)).toBe(true);
    expect(repo.produtos[0].quantidadeAtual).toBe(3000);
  });

  it('toques rápidos sucessivos produzem um registro cada, sem agrupar', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ quantidadeAtual: milesimos(5000) }),
    ]);
    const result = await montar(() => useDarBaixa(repo, relogio, new CompraRepositorioFalso()));
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

  // ACHADO pós-arquivamento (correcao-lista-de-compras): usuário removeu um
  // faltante da lista pelo X ("não vou comprar desta vez"), mas depois usou
  // mais dele — esperava que o item voltasse, não que a exclusão antiga
  // continuasse escondendo pra sempre. "Usei" de novo é o sinal de que a
  // necessidade voltou.
  it('reativa a exclusão da lista quando a pessoa usa mais do item já removido', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', quantidadeAtual: milesimos(1000) }),
    ]);
    const compras = new CompraRepositorioFalso();
    const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
    if (!aberta.ok) {
      throw new Error('setup do teste falhou');
    }
    const excluido = await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p1',
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
      excluido: true,
    });

    const result = await montar(() => useDarBaixa(repo, relogio, compras));
    await result.current.registrar('p1', milesimos(500));

    const linha = compras.itens.find((i) => i.id === excluido.id);
    expect(linha?.excluido).toBe(false);
  });

  it('item sem nenhuma exclusão pendente na lista não sofre nenhuma escrita extra', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', quantidadeAtual: milesimos(1000) }),
    ]);
    const compras = new CompraRepositorioFalso();

    const result = await montar(() => useDarBaixa(repo, relogio, compras));
    await result.current.registrar('p1', milesimos(500));

    expect(compras.compras).toHaveLength(0);
    expect(compras.itens).toHaveLength(0);
  });

  it('exclusão de OUTRO produto na mesma compra não é afetada', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', quantidadeAtual: milesimos(1000) }),
    ]);
    const compras = new CompraRepositorioFalso();
    const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
    if (!aberta.ok) {
      throw new Error('setup do teste falhou');
    }
    const excluidoDeOutro = await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p2',
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
      excluido: true,
    });

    const result = await montar(() => useDarBaixa(repo, relogio, compras));
    await result.current.registrar('p1', milesimos(500));

    const linha = compras.itens.find((i) => i.id === excluidoDeOutro.id);
    expect(linha?.excluido).toBe(true);
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
    const baixa = await montar(() => useDarBaixa(repo, relogio, new CompraRepositorioFalso()));

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
    const baixa = await montar(() => useDarBaixa(repo, relogio, new CompraRepositorioFalso()));

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
