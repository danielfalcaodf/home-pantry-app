import { act, cleanup, renderHook } from '@testing-library/react-native';

import { ItemListaAvulso, ItemListaProduto } from '../../domain/lista/lista';
import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { CompraRepositorioFalso } from './teste/repositorio-compra-falso';
import { useRemoverItemDaLista } from './use-remover-item-lista';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  relogio: { agora: () => 1000 },
  compraRepository: undefined,
}));

afterEach(cleanup);

const ITEM: ItemListaProduto = {
  tipo: 'produto',
  produtoId: 'p1',
  nome: 'Arroz',
  categoria: 'Grãos',
  unidade: 'pacote',
  quantidadeAComprar: milesimos(2000),
  valorUnitario: centavos(890),
  custo: centavos(1780),
  semPreco: false,
};

const AVULSO: ItemListaAvulso = {
  tipo: 'avulso',
  itemId: 'item-avulso-1',
  nome: 'Pilha AA',
  categoria: null,
  unidade: 'un',
  quantidadeAComprar: milesimos(2000),
  valorUnitario: centavos(300),
  custo: centavos(600),
  semPreco: false,
};

describe('useRemoverItemDaLista', () => {
  it('cria a compra aberta sob demanda e marca a exclusão, sem alterar estoque nem produto', async () => {
    const compras = new CompraRepositorioFalso();
    const { result } = await renderHook(() => useRemoverItemDaLista(compras));

    await act(async () => {
      await result.current.remover(ITEM);
    });

    expect(compras.compras).toHaveLength(1);
    expect(compras.itens).toHaveLength(1);
    expect(compras.itens[0]).toMatchObject({ produtoId: 'p1', excluido: true });
    expect(result.current.ultimaRemocao?.nome).toBe('Arroz');
  });

  it('desfazer remove a marcação de exclusão na mesma sessão', async () => {
    const compras = new CompraRepositorioFalso();
    const { result } = await renderHook(() => useRemoverItemDaLista(compras));

    await act(async () => {
      await result.current.remover(ITEM);
    });
    expect(compras.itens).toHaveLength(1);

    await act(async () => {
      await result.current.desfazer();
    });
    expect(compras.itens).toHaveLength(0);
    expect(result.current.ultimaRemocao).toBeNull();
  });

  it('reusa a compra aberta existente ao remover um segundo item', async () => {
    const compras = new CompraRepositorioFalso();
    const { result } = await renderHook(() => useRemoverItemDaLista(compras));

    await act(async () => {
      await result.current.remover(ITEM);
    });
    await act(async () => {
      await result.current.remover({ ...ITEM, produtoId: 'p2', nome: 'Feijão' });
    });

    expect(compras.compras).toHaveLength(1);
    expect(compras.itens).toHaveLength(2);
  });

  // ACHADO (correcao-lista-de-compras, task 2.4-2.5): reprodução do bug
  // relatado — "Queijo mussarela" nunca aparecia na Lista, mesmo depois de
  // reiniciar o app. Causa raiz encontrada inspecionando o banco do
  // dispositivo de QA: existiam DUAS linhas de compra_item pro mesmo
  // produtoId na mesma compra aberta (uma de `iniciarCompra`, sem
  // excluido; outra de `remover`, com excluido=true) — `compuserLista`
  // exclui pelo produtoId de QUALQUER linha marcada, então a existência da
  // segunda linha escondia o produto pra sempre, mesmo com a primeira
  // ainda válida. Não era timing/reatividade, como a suspeita inicial.
  it('produto já materializado por iniciarCompra reaproveita a linha existente, sem criar uma segunda', async () => {
    const compras = new CompraRepositorioFalso();
    const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
    if (!aberta.ok) {
      throw new Error('setup do teste falhou');
    }
    // Simula o que `iniciarCompra` já teria feito: uma linha materializada,
    // sem exclusão, pro mesmo produtoId que será removido a seguir.
    const materializado = await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p1',
      unidade: 'un',
      quantidadePlanejada: milesimos(300),
    });

    const { result } = await renderHook(() => useRemoverItemDaLista(compras));
    await act(async () => {
      await result.current.remover(ITEM);
    });

    // Continua havendo só UMA linha pro produto — reaproveitada, não duplicada.
    const linhasDoProduto = compras.itens.filter((item) => item.produtoId === 'p1');
    expect(linhasDoProduto).toHaveLength(1);
    expect(linhasDoProduto[0].id).toBe(materializado.id);
    expect(linhasDoProduto[0].excluido).toBe(true);
  });

  it('desfazer, quando reaproveitou uma linha já materializada, reverte a exclusão em vez de apagar a linha', async () => {
    const compras = new CompraRepositorioFalso();
    const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
    if (!aberta.ok) {
      throw new Error('setup do teste falhou');
    }
    const materializado = await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p1',
      unidade: 'un',
      quantidadePlanejada: milesimos(300),
      valorEstimadoUnit: centavos(500),
    });

    const { result } = await renderHook(() => useRemoverItemDaLista(compras));
    await act(async () => {
      await result.current.remover(ITEM);
    });
    await act(async () => {
      await result.current.desfazer();
    });

    // A linha original continua existindo (não foi apagada) e voltou a não
    // estar excluída — preserva os dados já materializados por iniciarCompra.
    expect(compras.itens).toHaveLength(1);
    expect(compras.itens[0].id).toBe(materializado.id);
    expect(compras.itens[0].excluido).toBe(false);
    expect(compras.itens[0].valorEstimadoUnit).toBe(500);
  });

  // ACHADO de QA (correcao-lista-de-compras, task 5.3): remover um avulso
  // nunca oferecia desfazer, porque usava um estado desconectado
  // (useEditarAvulso) do que alimenta o toast (ultimaRemocao). Unificado
  // aqui: removerAvulso agora popula o mesmo ultimaRemocao que remover().
  describe('removerAvulso', () => {
    it('apaga a linha do avulso e preenche ultimaRemocao pro toast de desfazer', async () => {
      const compras = new CompraRepositorioFalso();
      const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
      if (!aberta.ok) {
        throw new Error('setup do teste falhou');
      }
      const criado = await compras.adicionarItem(aberta.valor.id, {
        nomeAvulso: AVULSO.nome,
        unidade: AVULSO.unidade,
        quantidadePlanejada: AVULSO.quantidadeAComprar,
        valorEstimadoUnit: AVULSO.valorUnitario,
      });

      const { result } = await renderHook(() => useRemoverItemDaLista(compras));
      await act(async () => {
        await result.current.removerAvulso({ ...AVULSO, itemId: criado.id });
      });

      expect(compras.itens).toHaveLength(0);
      expect(result.current.ultimaRemocao?.nome).toBe('Pilha AA');
    });

    it('desfazer recria a linha do avulso apagada, com os mesmos dados', async () => {
      const compras = new CompraRepositorioFalso();
      const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
      if (!aberta.ok) {
        throw new Error('setup do teste falhou');
      }
      const criado = await compras.adicionarItem(aberta.valor.id, {
        nomeAvulso: AVULSO.nome,
        unidade: AVULSO.unidade,
        quantidadePlanejada: AVULSO.quantidadeAComprar,
        valorEstimadoUnit: AVULSO.valorUnitario,
      });

      const { result } = await renderHook(() => useRemoverItemDaLista(compras));
      await act(async () => {
        await result.current.removerAvulso({ ...AVULSO, itemId: criado.id });
      });
      await act(async () => {
        await result.current.desfazer();
      });

      expect(compras.itens).toHaveLength(1);
      expect(compras.itens[0]).toMatchObject({
        nomeAvulso: 'Pilha AA',
        unidade: 'un',
        quantidadePlanejada: milesimos(2000),
        valorEstimadoUnit: centavos(300),
      });
      expect(result.current.ultimaRemocao).toBeNull();
    });
  });
});
