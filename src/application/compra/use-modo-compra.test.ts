import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { ObservadorFalso, produtoFalso, ProdutoRepositorioFalso } from '../estoque/teste/repositorio-falso';
import { CompraRepositorioFalso } from '../lista/teste/repositorio-compra-falso';
import { useModoCompra } from './use-modo-compra';

jest.mock('../../composicao/repositorios', () => ({ compraRepository: undefined }));
jest.mock('../../composicao/observador', () => ({ observadorDoBanco: undefined }));

afterEach(cleanup);

async function montarCompraComItem() {
  const produtos = new ProdutoRepositorioFalso([
    produtoFalso({ id: 'p1', nome: 'Arroz', quantidadeAtual: milesimos(0), quantidadeNecessaria: milesimos(2000) }),
  ]);
  const compras = new CompraRepositorioFalso(produtos);
  const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
  if (!aberta.ok) {
    throw new Error('setup');
  }
  const item = await compras.adicionarItem(aberta.valor.id, {
    produtoId: 'p1',
    unidade: 'un',
    quantidadePlanejada: milesimos(2000),
    valorEstimadoUnit: centavos(890),
  });
  return { compras, produtos, compraId: aberta.valor.id, item, observador: new ObservadorFalso() };
}

describe('useModoCompra', () => {
  it('marca o item assumindo a quantidade planejada quando não há ajuste', async () => {
    const { compras, compraId, item, observador } = await montarCompraComItem();
    const { result } = await renderHook(() => useModoCompra(compraId, compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.marcar(item);
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.comprado).toBe(true));
    expect(result.current.itens[0].item.quantidadeComprada).toBe(2000);
  });

  it('desmarcar reverte a marcação sem apagar os valores ajustados', async () => {
    const { compras, compraId, item, observador } = await montarCompraComItem();
    const { result } = await renderHook(() => useModoCompra(compraId, compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.marcar(item);
      await result.current.ajustarPreco(item.id, centavos(950));
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.comprado).toBe(true));

    await act(async () => {
      await result.current.desmarcar(item.id);
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.comprado).toBe(false));
    expect(result.current.itens[0].item.valorPagoUnitario).toBe(950);
  });

  it('ajustar quantidade e preço recalcula o que fica gravado no item', async () => {
    const { compras, compraId, item, observador } = await montarCompraComItem();
    const { result } = await renderHook(() => useModoCompra(compraId, compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.ajustarQuantidade(item.id, milesimos(1500));
      await result.current.ajustarPreco(item.id, centavos(700));
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.quantidadeComprada).toBe(1500));
    expect(result.current.itens[0].item.valorPagoUnitario).toBe(700);
  });

  it('responder a pergunta de preço grava a resposta no item, sem alterar o produto', async () => {
    const { compras, produtos, compraId, item, observador } = await montarCompraComItem();
    const { result } = await renderHook(() => useModoCompra(compraId, compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.responderAtualizarPreco(item.id, true);
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.atualizarPreco).toBe(true));
    expect(produtos.produtos[0].valorUnitario).toBe(890);
  });

  it('detecta divergência de preço, inclusive quando o produto não tem preço cadastrado', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', nome: 'Arroz', valorUnitario: centavos(890) }),
      produtoFalso({ id: 'p2', nome: 'Feijão', valorUnitario: centavos(0) }),
    ]);
    const compras = new CompraRepositorioFalso(produtos);
    const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
    if (!aberta.ok) {
      throw new Error('setup');
    }
    const item1 = await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p1',
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });
    const item2 = await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p2',
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });
    const avulso = await compras.adicionarItem(aberta.valor.id, {
      nomeAvulso: 'Pilha AA',
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });
    await compras.editarItem(item1.id, { valorPagoUnitario: centavos(950) });
    await compras.editarItem(item2.id, { valorPagoUnitario: centavos(300) });
    await compras.editarItem(avulso.id, { valorPagoUnitario: centavos(300) });

    const observador = new ObservadorFalso();
    const { result } = await renderHook(() => useModoCompra(aberta.valor.id, compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    const porId = new Map(result.current.itens.map((i) => [i.item.id, i]));
    expect(porId.get(item1.id)?.divergePreco).toBe(true);
    expect(porId.get(item2.id)?.divergePreco).toBe(true); // sem preço cadastrado (D5)
    expect(porId.get(avulso.id)?.divergePreco).toBe(false); // avulso nunca pergunta (4.4)
  });

  it('retomada: marcações preservadas ao sair e voltar, pois o estado vem sempre do repositório', async () => {
    const { compras, compraId, item, observador } = await montarCompraComItem();
    await compras.editarItem(item.id, { comprado: true, quantidadeComprada: milesimos(2000) });

    const primeira = await renderHook(() => useModoCompra(compraId, compras, observador));
    await waitFor(() => expect(primeira.result.current.carregando).toBe(false));
    expect(primeira.result.current.itens[0].item.comprado).toBe(true);
    await act(async () => {
      primeira.unmount();
    });

    // "voltar à tela": nova instância do hook, mesmo compraId.
    const segunda = await renderHook(() => useModoCompra(compraId, compras, observador));
    await waitFor(() => expect(segunda.result.current.carregando).toBe(false));
    expect(segunda.result.current.itens[0].item.comprado).toBe(true);
    expect(segunda.result.current.itens[0].item.quantidadeComprada).toBe(2000);
  });

  // ACHADO-054 (task 4): reproduzido e não confirmado com um componente real
  // — teste dedicado em app/compra/toques-consecutivos.test.tsx, pois
  // renderizar `ItemCompra` (presentation/) aqui violaria a regra de
  // dependência application/ → presentation/ (CLAUDE.md).
});
