import { act, cleanup, renderHook } from '@testing-library/react-native';

import { itemDeFaltante } from '../../domain/lista/lista.rules';
import { FaltanteBruto } from '../../domain/produto/produto';
import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { CompraRepositorioFalso } from '../lista/teste/repositorio-compra-falso';
import { useRemoverItemDaLista } from '../lista/use-remover-item-lista';
import { useIniciarCompra } from './use-iniciar-compra';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  relogio: { agora: () => 1000 },
  compraRepository: undefined,
}));

afterEach(cleanup);

function faltante(sobrescreve: Partial<FaltanteBruto> = {}): FaltanteBruto {
  return {
    id: 'p1',
    nome: 'Arroz',
    categoria: 'Grãos',
    unidade: 'un',
    valorUnitario: centavos(890),
    quantidadeAtual: milesimos(500),
    quantidadeNecessaria: milesimos(2000),
    faltaBruta: milesimos(1500),
    fatorConversaoEmbalagem: null,
    valorReferenciaEmbalagem: null,
    ...sobrescreve,
  };
}

describe('useIniciarCompra', () => {
  // Achado de QA: materializar item a item deixava "Iniciar compra"
  // perceptivelmente lento com a lista inteira (uma ida ao banco por item) —
  // precisa ser uma única chamada em lote, não um loop de `adicionarItem`.
  it('materializa vários itens numa única chamada em lote, não uma por item', async () => {
    const compras = new CompraRepositorioFalso();
    const chamadasEmLote = jest.spyOn(compras, 'adicionarItens');
    const itens = [
      itemDeFaltante(faltante({ id: 'p1' })),
      itemDeFaltante(faltante({ id: 'p2', nome: 'Feijão' })),
      itemDeFaltante(faltante({ id: 'p3', nome: 'Café' })),
    ];
    const { result } = await renderHook(() => useIniciarCompra(compras));

    await act(async () => {
      await result.current.iniciar(itens);
    });

    expect(chamadasEmLote).toHaveBeenCalledTimes(1);
    expect(compras.itens).toHaveLength(3);
  });

  it('materializa os itens do estoque da lista corrente, com a quantidade e o preço exatamente exibidos', async () => {
    const compras = new CompraRepositorioFalso();
    const item = itemDeFaltante(faltante());
    const { result } = await renderHook(() => useIniciarCompra(compras));

    let compraId = '';
    await act(async () => {
      compraId = await result.current.iniciar([item]);
    });

    expect(compras.itens).toHaveLength(1);
    expect(compras.itens[0]).toMatchObject({
      compraId,
      produtoId: 'p1',
      quantidadePlanejada: item.quantidadeAComprar,
      valorEstimadoUnit: 890,
    });
  });

  it('não duplica itens avulsos, que já pertencem à compra aberta', async () => {
    const compras = new CompraRepositorioFalso();
    const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
    if (!aberta.ok) {
      throw new Error('setup');
    }
    await compras.adicionarItem(aberta.valor.id, {
      nomeAvulso: 'Pilha AA',
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });
    const { result } = await renderHook(() => useIniciarCompra(compras));

    await act(async () => {
      await result.current.iniciar([itemDeFaltante(faltante())]);
    });

    expect(compras.itens.filter((i) => i.nomeAvulso !== null)).toHaveLength(1);
    expect(compras.itens.filter((i) => i.produtoId !== null)).toHaveLength(1);
  });

  it('chamar iniciar duas vezes não duplica o mesmo produto já materializado', async () => {
    const compras = new CompraRepositorioFalso();
    const item = itemDeFaltante(faltante());
    const { result } = await renderHook(() => useIniciarCompra(compras));

    await act(async () => {
      await result.current.iniciar([item]);
    });
    await act(async () => {
      await result.current.iniciar([item]);
    });

    expect(compras.itens.filter((i) => i.produtoId === 'p1')).toHaveLength(1);
  });

  // Bug relatado: preço editado na Lista de compras (produto.valorUnitario)
  // não aparecia no Modo Compra quando o item já tinha sido materializado
  // numa compra aberta residual, antes da edição — "Iniciar compra" pulava
  // o item pelo dedup, sem nunca atualizar valorEstimadoUnit.
  it('reabrir a compra sincroniza valorEstimadoUnit quando o preço do produto mudou desde a materialização', async () => {
    const compras = new CompraRepositorioFalso();
    const { result } = await renderHook(() => useIniciarCompra(compras));

    // Primeira "Iniciar compra": item sem preço (0).
    await act(async () => {
      await result.current.iniciar([itemDeFaltante(faltante({ valorUnitario: centavos(0) }))]);
    });
    expect(compras.itens[0].valorEstimadoUnit).toBe(0);

    // Preço editado na Lista (fora deste hook) e "Iniciar compra" chamado
    // de novo — mesma compra aberta, item já materializado.
    await act(async () => {
      await result.current.iniciar([itemDeFaltante(faltante({ valorUnitario: centavos(1000) }))]);
    });

    expect(compras.itens).toHaveLength(1);
    expect(compras.itens[0].valorEstimadoUnit).toBe(1000);
  });

  it('reabrir a compra não mexe em valorEstimadoUnit de item já marcado como comprado', async () => {
    const compras = new CompraRepositorioFalso();
    const { result } = await renderHook(() => useIniciarCompra(compras));

    let compraId = '';
    await act(async () => {
      compraId = await result.current.iniciar([itemDeFaltante(faltante({ valorUnitario: centavos(500) }))]);
    });
    await compras.editarItem(compras.itens[0].id, { comprado: true, valorPagoUnitario: centavos(500) });

    await act(async () => {
      await result.current.iniciar([itemDeFaltante(faltante({ valorUnitario: centavos(1000) }))]);
    });

    expect(compras.itens[0].valorEstimadoUnit).toBe(500);
    expect(compras.itens[0].compraId).toBe(compraId);
  });

  // Bug achado pelo E2E (correcao-unidades-un-kg-preco, task 6.5): produto
  // removido da Lista e devolvido reaproveita a linha-marcador da exclusão,
  // criada com quantidade de espaço reservado — entrava na compra com 1 un
  // no lugar dos 2 que faltavam (o preço já era ressincronizado).
  it('produto removido e devolvido à Lista entra na compra com a falta atual, não com a quantidade reservada', async () => {
    const compras = new CompraRepositorioFalso();
    const feijao = itemDeFaltante(
      faltante({ id: 'p1', nome: 'Feijão', valorUnitario: centavos(0), quantidadeAtual: milesimos(0), faltaBruta: milesimos(2000) }),
    );
    const { result: remocao } = await renderHook(() => useRemoverItemDaLista(compras));
    await act(async () => {
      await remocao.current.remover(feijao as Extract<typeof feijao, { tipo: 'produto' }>);
    });
    await act(async () => {
      await remocao.current.reativar(compras.itens[0].id);
    });
    const comPreco = itemDeFaltante(
      faltante({ id: 'p1', nome: 'Feijão', valorUnitario: centavos(550), quantidadeAtual: milesimos(0), faltaBruta: milesimos(2000) }),
    );
    const { result } = await renderHook(() => useIniciarCompra(compras));

    await act(async () => {
      await result.current.iniciar([comPreco]);
    });

    expect(compras.itens).toHaveLength(1);
    expect(compras.itens[0]).toMatchObject({ quantidadePlanejada: 2000, valorEstimadoUnit: 550, excluido: false });
  });

  it('reabrir a compra acompanha a falta que mudou desde a materialização', async () => {
    const compras = new CompraRepositorioFalso();
    const { result } = await renderHook(() => useIniciarCompra(compras));

    await act(async () => {
      await result.current.iniciar([itemDeFaltante(faltante({ quantidadeAtual: milesimos(1000), faltaBruta: milesimos(1000) }))]);
    });
    expect(compras.itens[0].quantidadePlanejada).toBe(1000);

    await act(async () => {
      await result.current.iniciar([itemDeFaltante(faltante({ quantidadeAtual: milesimos(0), faltaBruta: milesimos(2000) }))]);
    });

    expect(compras.itens).toHaveLength(1);
    expect(compras.itens[0].quantidadePlanejada).toBe(2000);
  });

  it('ressincronizar a quantidade planejada preserva o ajuste manual feito no Modo Compra', async () => {
    const compras = new CompraRepositorioFalso();
    const { result } = await renderHook(() => useIniciarCompra(compras));
    await act(async () => {
      await result.current.iniciar([itemDeFaltante(faltante({ quantidadeAtual: milesimos(1000), faltaBruta: milesimos(1000) }))]);
    });
    await compras.editarItem(compras.itens[0].id, { quantidadeComprada: milesimos(5000) });

    await act(async () => {
      await result.current.iniciar([itemDeFaltante(faltante({ quantidadeAtual: milesimos(0), faltaBruta: milesimos(2000) }))]);
    });

    expect(compras.itens[0]).toMatchObject({ quantidadePlanejada: 2000, quantidadeComprada: 5000 });
  });

  it('reabrir a compra não mexe na quantidade de item já marcado como comprado', async () => {
    const compras = new CompraRepositorioFalso();
    const { result } = await renderHook(() => useIniciarCompra(compras));
    await act(async () => {
      await result.current.iniciar([itemDeFaltante(faltante({ quantidadeAtual: milesimos(1000), faltaBruta: milesimos(1000) }))]);
    });
    await compras.editarItem(compras.itens[0].id, { comprado: true, quantidadeComprada: milesimos(1000) });

    await act(async () => {
      await result.current.iniciar([itemDeFaltante(faltante({ quantidadeAtual: milesimos(0), faltaBruta: milesimos(2000) }))]);
    });

    expect(compras.itens[0].quantidadePlanejada).toBe(1000);
  });

  it('item já em dia (mesmo preço e mesma falta) não gera escrita ao reabrir', async () => {
    const compras = new CompraRepositorioFalso();
    const item = itemDeFaltante(faltante());
    const { result } = await renderHook(() => useIniciarCompra(compras));
    await act(async () => {
      await result.current.iniciar([item]);
    });
    const edicoes = jest.spyOn(compras, 'editarItem');

    await act(async () => {
      await result.current.iniciar([item]);
    });

    expect(edicoes).not.toHaveBeenCalled();
  });
});
