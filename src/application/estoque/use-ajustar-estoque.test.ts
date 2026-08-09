import { cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { milesimos } from '../../domain/shared/quantidade';
import { ProdutoRepositorioFalso, produtoFalso } from './teste/repositorio-falso';
import { useAjustarEstoque } from './use-ajustar-estoque';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  produtoRepository: undefined,
  relogio: { agora: () => 1_700_000_000_000 },
}));

const relogio = { agora: () => 1_700_000_000_000 };

async function montar<T>(callback: () => T) {
  const { result } = await renderHook(callback);
  await waitFor(() => expect(result.current).not.toBeNull());
  return result;
}

afterEach(cleanup);

describe('useAjustarEstoque', () => {
  it('ajuste para cima grava o movimento e devolve o saldo', async () => {
    const repo = new ProdutoRepositorioFalso([produtoFalso({ quantidadeAtual: milesimos(2000) })]);
    const result = await montar(() => useAjustarEstoque(repo, relogio));
    const resultado = await result.current.ajustar('p1', milesimos(2000), milesimos(5000));
    expect(resultado).toEqual(
      expect.objectContaining({ ajustou: true, saldoResultante: 5000 }),
    );
    expect(repo.produtos[0].quantidadeAtual).toBe(5000);
    expect(repo.movimentos[0]).toEqual(
      expect.objectContaining({ tipo: 'ajuste', delta: 3000, motivo: null }),
    );
  });

  it('ajuste para baixo grava a variação negativa', async () => {
    const repo = new ProdutoRepositorioFalso([produtoFalso({ quantidadeAtual: milesimos(5000) })]);
    const result = await montar(() => useAjustarEstoque(repo, relogio));
    const resultado = await result.current.ajustar('p1', milesimos(5000), milesimos(2000));
    expect(resultado).toEqual(
      expect.objectContaining({ ajustou: true, saldoResultante: 2000 }),
    );
    expect(repo.movimentos[0].delta).toBe(-3000);
  });

  it('ajuste para zero é aceito', async () => {
    const repo = new ProdutoRepositorioFalso([produtoFalso({ quantidadeAtual: milesimos(3000) })]);
    const result = await montar(() => useAjustarEstoque(repo, relogio));
    const resultado = await result.current.ajustar('p1', milesimos(3000), milesimos(0));
    expect(resultado).toEqual(
      expect.objectContaining({ ajustou: true, saldoResultante: 0 }),
    );
  });

  it('valor igual ao registrado não grava nada', async () => {
    const repo = new ProdutoRepositorioFalso([produtoFalso({ quantidadeAtual: milesimos(3000) })]);
    const result = await montar(() => useAjustarEstoque(repo, relogio));
    const resultado = await result.current.ajustar('p1', milesimos(3000), milesimos(3000));
    expect(resultado).toEqual({ ajustou: false, motivo: 'sem_mudanca' });
    expect(repo.movimentos).toHaveLength(0);
  });

  it('valor negativo é rejeitado sem chamar o repositório', async () => {
    const repo = new ProdutoRepositorioFalso([produtoFalso({ quantidadeAtual: milesimos(3000) })]);
    const espiao = jest.spyOn(repo, 'ajustar');
    const result = await montar(() => useAjustarEstoque(repo, relogio));
    const resultado = await result.current.ajustar('p1', milesimos(3000), milesimos(-1000));
    expect(resultado).toEqual({ ajustou: false, motivo: 'valor_negativo' });
    expect(espiao).not.toHaveBeenCalled();
  });

  it('motivo é passado ao repositório quando informado', async () => {
    const repo = new ProdutoRepositorioFalso([produtoFalso({ quantidadeAtual: milesimos(3000) })]);
    const result = await montar(() => useAjustarEstoque(repo, relogio));
    await result.current.ajustar('p1', milesimos(3000), milesimos(0), 'vencimento');
    expect(repo.movimentos[0].motivo).toBe('vencimento');
  });

  it('produto inexistente retorna nao_encontrado', async () => {
    const repo = new ProdutoRepositorioFalso([]);
    const result = await montar(() => useAjustarEstoque(repo, relogio));
    const resultado = await result.current.ajustar('fantasma', milesimos(0), milesimos(1000));
    expect(resultado).toEqual({ ajustou: false, motivo: 'nao_encontrado' });
  });

  it('falha de gravação é sinalizada sem alterar a quantidade', async () => {
    const repo = new ProdutoRepositorioFalso([produtoFalso({ quantidadeAtual: milesimos(3000) })]);
    jest.spyOn(repo, 'ajustar').mockRejectedValueOnce(new Error('banco indisponível'));
    const result = await montar(() => useAjustarEstoque(repo, relogio));
    const resultado = await result.current.ajustar('p1', milesimos(3000), milesimos(5000));
    expect(resultado).toEqual({ erro: true });
    expect(repo.produtos[0].quantidadeAtual).toBe(3000);
  });
});
