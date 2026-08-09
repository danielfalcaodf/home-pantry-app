import { act, cleanup, renderHook } from '@testing-library/react-native';

import { totalPago } from '../../domain/compra/compra.rules';
import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { produtoFalso, ProdutoRepositorioFalso } from '../estoque/teste/repositorio-falso';
import { CompraRepositorioFalso } from '../lista/teste/repositorio-compra-falso';
import { useFinalizarCompra } from './use-finalizar-compra';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  relogio: { agora: () => 5000 },
  compraRepository: undefined,
  produtoRepository: undefined,
}));

afterEach(cleanup);

async function prepararCompra() {
  const produtos = new ProdutoRepositorioFalso([
    produtoFalso({ id: 'p1', nome: 'Arroz', quantidadeAtual: milesimos(1000), valorUnitario: centavos(890) }),
    produtoFalso({ id: 'p2', nome: 'Feijão', quantidadeAtual: milesimos(0), valorUnitario: centavos(700) }),
  ]);
  const compras = new CompraRepositorioFalso(produtos);
  const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
  if (!aberta.ok) {
    throw new Error('setup');
  }
  const item1 = await compras.adicionarItem(aberta.valor.id, {
    produtoId: 'p1',
    unidade: 'un',
    quantidadePlanejada: milesimos(2000),
  });
  const item2 = await compras.adicionarItem(aberta.valor.id, {
    produtoId: 'p2',
    unidade: 'un',
    quantidadePlanejada: milesimos(1000),
  });
  const avulso = await compras.adicionarItem(aberta.valor.id, {
    nomeAvulso: 'Pilha AA',
    unidade: 'un',
    quantidadePlanejada: milesimos(2000),
  });
  return { produtos, compras, compraId: aberta.valor.id, item1, item2, avulso };
}

describe('total corrente do rodapé bate com o total gravado no fechamento', () => {
  it('o total calculado por totalPago antes de fechar é igual ao valorTotalPago gravado', async () => {
    const { produtos, compras, compraId, item1, item2 } = await prepararCompra();
    await compras.editarItem(item1.id, {
      comprado: true,
      quantidadeComprada: milesimos(2000),
      valorPagoUnitario: centavos(950),
    });
    await compras.editarItem(item2.id, {
      comprado: true,
      quantidadeComprada: milesimos(1000),
      valorPagoUnitario: centavos(700),
    });

    const itensAntes = (await compras.listarItens(compraId)).map((i) => i.item);
    const totalExibidoNoRodape = totalPago(itensAntes);

    const { result } = await renderHook(() => useFinalizarCompra(compras, produtos));
    await act(async () => {
      await result.current.finalizar(compraId);
    });

    const compra = compras.compras.find((c) => c.id === compraId);
    expect(compra?.valorTotalPago).toBe(totalExibidoNoRodape);
  });
});

describe('useFinalizarCompra', () => {
  it('repõe apenas os itens marcados e informa quantos foram repostos', async () => {
    const { produtos, compras, compraId, item1 } = await prepararCompra();
    await compras.editarItem(item1.id, {
      comprado: true,
      quantidadeComprada: milesimos(2000),
      valorPagoUnitario: centavos(890),
    });
    const { result } = await renderHook(() => useFinalizarCompra(compras, produtos));

    let resultado;
    await act(async () => {
      resultado = await result.current.finalizar(compraId);
    });

    expect(resultado).toEqual({ ok: true, itensRepostos: 1 });
    expect(produtos.produtos.find((p) => p.id === 'p1')?.quantidadeAtual).toBe(3000);
  });

  it('avulso marcado não altera nenhuma quantidade nem gera reposição', async () => {
    const { produtos, compras, compraId, avulso } = await prepararCompra();
    await compras.editarItem(avulso.id, {
      comprado: true,
      quantidadeComprada: milesimos(2000),
      valorPagoUnitario: centavos(300),
    });
    const antes = produtos.produtos.map((p) => p.quantidadeAtual);
    const { result } = await renderHook(() => useFinalizarCompra(compras, produtos));

    let resultado;
    await act(async () => {
      resultado = await result.current.finalizar(compraId);
    });

    expect(resultado).toEqual({ ok: true, itensRepostos: 0 });
    expect(produtos.produtos.map((p) => p.quantidadeAtual)).toEqual(antes);
  });

  it('itens não marcados não geram reposição', async () => {
    const { produtos, compras, compraId } = await prepararCompra();
    const { result } = await renderHook(() => useFinalizarCompra(compras, produtos));

    let resultado;
    await act(async () => {
      resultado = await result.current.finalizar(compraId);
    });

    expect(resultado).toEqual({ ok: true, itensRepostos: 0 });
  });

  it('permite fechar uma compra sem nenhum item marcado, com total zero', async () => {
    const { produtos, compras, compraId } = await prepararCompra();
    const { result } = await renderHook(() => useFinalizarCompra(compras, produtos));

    await act(async () => {
      await result.current.finalizar(compraId);
    });

    expect(compras.compras.find((c) => c.id === compraId)?.valorTotalPago).toBe(0);
  });

  it('preenche a data de finalização ao mudar a situação', async () => {
    const { produtos, compras, compraId } = await prepararCompra();
    const { result } = await renderHook(() => useFinalizarCompra(compras, produtos));

    await act(async () => {
      await result.current.finalizar(compraId);
    });

    const compra = compras.compras.find((c) => c.id === compraId);
    expect(compra?.status).toBe('finalizada');
    expect(compra?.finalizadaEm).toBe(5000);
  });

  it('falha na gravação preserva as marcações, sem alterar a situação da compra', async () => {
    const { produtos, compras, compraId, item1 } = await prepararCompra();
    await compras.editarItem(item1.id, {
      comprado: true,
      quantidadeComprada: milesimos(2000),
      valorPagoUnitario: centavos(890),
    });
    jest.spyOn(compras, 'finalizar').mockRejectedValueOnce(new Error('falha de i/o'));
    const { result } = await renderHook(() => useFinalizarCompra(compras, produtos));

    let resultado;
    await act(async () => {
      resultado = await result.current.finalizar(compraId);
    });

    expect(resultado).toEqual({ ok: false, motivo: 'falha_na_gravacao' });
    const itens = await compras.listarItens(compraId);
    expect(itens.find((i) => i.item.id === item1.id)?.item.comprado).toBe(true);
    expect(compras.compras.find((c) => c.id === compraId)?.status).toBe('aberta');
  });
});

describe('atualização de preço de referência no fechamento', () => {
  it('confirmação (atualizarPreco true) atualiza o valor unitário do produto', async () => {
    const { produtos, compras, compraId, item1 } = await prepararCompra();
    await compras.editarItem(item1.id, {
      comprado: true,
      quantidadeComprada: milesimos(2000),
      valorPagoUnitario: centavos(950), // diverge de 890
      atualizarPreco: true,
    });
    const { result } = await renderHook(() => useFinalizarCompra(compras, produtos));
    await act(async () => {
      await result.current.finalizar(compraId);
    });
    expect(produtos.produtos.find((p) => p.id === 'p1')?.valorUnitario).toBe(950);
  });

  it('recusa (atualizarPreco false) não atualiza o valor unitário do produto', async () => {
    const { produtos, compras, compraId, item1 } = await prepararCompra();
    await compras.editarItem(item1.id, {
      comprado: true,
      quantidadeComprada: milesimos(2000),
      valorPagoUnitario: centavos(950),
      atualizarPreco: false,
    });
    const { result } = await renderHook(() => useFinalizarCompra(compras, produtos));
    await act(async () => {
      await result.current.finalizar(compraId);
    });
    expect(produtos.produtos.find((p) => p.id === 'p1')?.valorUnitario).toBe(890);
  });

  it('ausência de resposta (atualizarPreco null) não atualiza o valor unitário', async () => {
    const { produtos, compras, compraId, item1 } = await prepararCompra();
    await compras.editarItem(item1.id, {
      comprado: true,
      quantidadeComprada: milesimos(2000),
      valorPagoUnitario: centavos(950),
      // atualizarPreco permanece null: nunca perguntado/respondido
    });
    const { result } = await renderHook(() => useFinalizarCompra(compras, produtos));
    await act(async () => {
      await result.current.finalizar(compraId);
    });
    expect(produtos.produtos.find((p) => p.id === 'p1')?.valorUnitario).toBe(890);
  });

  it('produto sem preço cadastrado: confirmação registra o primeiro preço', async () => {
    const { produtos, compras, compraId, item2 } = await prepararCompra();
    await compras.editarItem(item2.id, {
      comprado: true,
      quantidadeComprada: milesimos(1000),
      valorPagoUnitario: centavos(700),
      atualizarPreco: true,
    });
    const { result } = await renderHook(() => useFinalizarCompra(compras, produtos));
    await act(async () => {
      await result.current.finalizar(compraId);
    });
    expect(produtos.produtos.find((p) => p.id === 'p2')?.valorUnitario).toBe(700);
  });

  it('falha no fechamento não altera nenhum valor unitário confirmado', async () => {
    const { produtos, compras, compraId, item1 } = await prepararCompra();
    await compras.editarItem(item1.id, {
      comprado: true,
      quantidadeComprada: milesimos(2000),
      valorPagoUnitario: centavos(950),
      atualizarPreco: true,
    });
    jest.spyOn(compras, 'finalizar').mockRejectedValueOnce(new Error('falha de i/o'));
    const { result } = await renderHook(() => useFinalizarCompra(compras, produtos));
    await act(async () => {
      await result.current.finalizar(compraId);
    });
    expect(produtos.produtos.find((p) => p.id === 'p1')?.valorUnitario).toBe(890);
  });
});
