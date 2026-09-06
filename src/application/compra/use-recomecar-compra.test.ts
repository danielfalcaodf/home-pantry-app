import { act, cleanup, renderHook } from '@testing-library/react-native';

import { itemDeFaltante } from '../../domain/lista/lista.rules';
import { FaltanteBruto } from '../../domain/produto/produto';
import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { obterOuAbrirCompra } from '../lista/compra-aberta';
import { CompraRepositorioFalso } from '../lista/teste/repositorio-compra-falso';
import { useRecomecarCompra } from './use-recomecar-compra';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  relogio: { agora: () => 9000 },
  compraRepository: undefined,
}));

afterEach(cleanup);

function faltante(sobrescreve: Partial<FaltanteBruto> = {}): FaltanteBruto {
  return {
    id: 'p1',
    nome: 'Arroz',
    categoria: 'Grãos',
    unidade: 'pacote',
    valorUnitario: centavos(890),
    quantidadeAtual: milesimos(500),
    quantidadeNecessaria: milesimos(2000),
    faltaBruta: milesimos(1500),
    fatorConversaoEmbalagem: null,
    valorReferenciaEmbalagem: null,
    ...sobrescreve,
  };
}

async function prepararRascunhoComProgresso(compras: CompraRepositorioFalso) {
  const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
  if (!aberta.ok) {
    throw new Error('setup');
  }
  const item = await compras.adicionarItem(aberta.valor.id, {
    produtoId: 'p-antigo',
    unidade: 'un',
    quantidadePlanejada: milesimos(1000),
    valorEstimadoUnit: centavos(300),
  });
  await compras.editarItem(item.id, {
    comprado: true,
    quantidadeComprada: milesimos(1000),
    valorPagoUnitario: centavos(300),
  });
  return { compraAntigaId: aberta.valor.id, itemAntigoId: item.id };
}

describe('transição atômica de compra aberta', () => {
  it('continuar a compra aberta preserva o rascunho sem cancelar nem recriar nada', async () => {
    const compras = new CompraRepositorioFalso();
    const { compraAntigaId } = await prepararRascunhoComProgresso(compras);

    const reaproveitada = await obterOuAbrirCompra(compras, 'casa-teste', 'usuario-teste', 9000);

    expect(reaproveitada.id).toBe(compraAntigaId);
    expect(compras.compras).toHaveLength(1);
    expect(compras.compras[0].status).toBe('aberta');
    expect(compras.itens).toHaveLength(1);
  });

  it('recomeçar cancela o rascunho anterior e materializa a lista atual em uma compra nova', async () => {
    const compras = new CompraRepositorioFalso();
    const { compraAntigaId, itemAntigoId } = await prepararRascunhoComProgresso(compras);
    const item = itemDeFaltante(faltante());
    const { result } = await renderHook(() => useRecomecarCompra(compras));

    let resultado: Awaited<ReturnType<typeof result.current.recomecar>>;
    await act(async () => {
      resultado = await result.current.recomecar([item]);
    });

    expect(resultado!).toEqual({ ok: true, compraId: expect.any(String) });
    const novaCompraId = resultado!.ok ? resultado!.compraId : '';
    expect(novaCompraId).not.toBe(compraAntigaId);
    expect(compras.compras.find((c) => c.id === compraAntigaId)?.status).toBe('cancelada');
    expect(compras.itens.find((i) => i.id === itemAntigoId)?.comprado).toBe(true);
    expect(compras.compras.find((c) => c.id === novaCompraId)?.status).toBe('aberta');
    expect(compras.itens.filter((i) => i.compraId === novaCompraId)).toEqual([
      expect.objectContaining({
        produtoId: 'p1',
        quantidadePlanejada: item.quantidadeAComprar,
        valorEstimadoUnit: 890,
      }),
    ]);
  });

  it('recomeçar nunca deixa duas compras abertas ao mesmo tempo', async () => {
    const compras = new CompraRepositorioFalso();
    await prepararRascunhoComProgresso(compras);
    const { result } = await renderHook(() => useRecomecarCompra(compras));

    await act(async () => {
      await result.current.recomecar([itemDeFaltante(faltante())]);
    });

    expect(compras.compras.filter((c) => c.status === 'aberta')).toHaveLength(1);
  });

  it('falha ao cancelar preserva o rascunho aberto e não cria compra nova', async () => {
    const compras = new CompraRepositorioFalso();
    const { compraAntigaId } = await prepararRascunhoComProgresso(compras);
    jest.spyOn(compras, 'cancelar').mockRejectedValueOnce(new Error('falha de i/o'));
    const { result } = await renderHook(() => useRecomecarCompra(compras));

    let resultado: Awaited<ReturnType<typeof result.current.recomecar>>;
    await act(async () => {
      resultado = await result.current.recomecar([itemDeFaltante(faltante())]);
    });

    expect(resultado!).toEqual({ ok: false });
    expect(compras.compras).toEqual([
      expect.objectContaining({ id: compraAntigaId, status: 'aberta' }),
    ]);
  });

  it('falha ao materializar a nova lista mantém o rascunho anterior aberto', async () => {
    const compras = new CompraRepositorioFalso();
    const { compraAntigaId, itemAntigoId } = await prepararRascunhoComProgresso(compras);
    jest.spyOn(compras, 'adicionarItem').mockRejectedValueOnce(new Error('falha de i/o'));
    const { result } = await renderHook(() => useRecomecarCompra(compras));

    let resultado: Awaited<ReturnType<typeof result.current.recomecar>>;
    await act(async () => {
      resultado = await result.current.recomecar([itemDeFaltante(faltante())]);
    });

    expect(resultado!).toEqual({ ok: false });
    expect(compras.compras.filter((c) => c.status === 'aberta')).toEqual([
      expect.objectContaining({ id: compraAntigaId }),
    ]);
    expect(compras.itens.find((i) => i.id === itemAntigoId)?.comprado).toBe(true);
  });

  it('falha ao criar a nova lista mantém o rascunho anterior aberto', async () => {
    const compras = new CompraRepositorioFalso();
    const { compraAntigaId } = await prepararRascunhoComProgresso(compras);
    jest.spyOn(compras, 'abrir').mockRejectedValueOnce(new Error('falha de i/o'));
    const { result } = await renderHook(() => useRecomecarCompra(compras));

    let resultado: Awaited<ReturnType<typeof result.current.recomecar>>;
    await act(async () => {
      resultado = await result.current.recomecar([itemDeFaltante(faltante())]);
    });

    expect(resultado!).toEqual({ ok: false });
    expect(compras.compras.filter((c) => c.status === 'aberta')).toEqual([
      expect.objectContaining({ id: compraAntigaId }),
    ]);
  });
});
