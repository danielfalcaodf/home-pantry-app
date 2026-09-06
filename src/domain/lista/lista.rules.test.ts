import { CompraItem } from '../compra/compra';
import { fatorConversao } from '../produto/conversao-embalagem.rules';
import { FaltanteBruto } from '../produto/produto';
import { centavos } from '../shared/dinheiro';
import { milesimos } from '../shared/quantidade';
import { compuserLista, itemDeAvulso, itemDeFaltante, totalDaListaDeCompras } from './lista.rules';

function faltante(sobrescreve: Partial<FaltanteBruto> = {}): FaltanteBruto {
  return {
    id: 'p1',
    nome: 'Arroz',
    categoria: 'Grãos',
    unidade: 'pacote',
    valorUnitario: centavos(0),
    quantidadeAtual: milesimos(0),
    quantidadeNecessaria: milesimos(3000),
    faltaBruta: milesimos(3000),
    fatorConversaoEmbalagem: null,
    valorReferenciaEmbalagem: null,
    ...sobrescreve,
  };
}

function avulso(sobrescreve: Partial<CompraItem> = {}): CompraItem {
  return {
    id: 'item-1',
    compraId: 'compra-1',
    produtoId: null,
    nomeAvulso: 'Carvão',
    unidade: 'un',
    quantidadePlanejada: milesimos(1000),
    quantidadeComprada: null,
    valorEstimadoUnit: centavos(0),
    valorPagoUnitario: null,
    quantidadePacotes: null,
    fatorUsadoNaCompra: null,
    comprado: false,
    ordem: 0,
    excluido: false,
    atualizarPreco: null,
    ...sobrescreve,
  };
}

describe('itemDeFaltante', () => {
  it('arredonda para cima em unidade indivisível e calcula o custo sobre o arredondado', () => {
    const item = itemDeFaltante(
      faltante({
        unidade: 'pacote',
        quantidadeAtual: milesimos(2500),
        quantidadeNecessaria: milesimos(3000),
        valorUnitario: centavos(1000),
      }),
    );
    expect(item.quantidadeAComprar).toBe(1000); // 0,5 pacote arredonda para 1
    expect(item.custo).toBe(1000); // 1 pacote × R$10, não 0,5 × R$10
  });

  it('preserva a fração em unidade divisível', () => {
    const item = itemDeFaltante(
      faltante({
        unidade: 'kg',
        quantidadeAtual: milesimos(500),
        quantidadeNecessaria: milesimos(2000),
      }),
    );
    expect(item.quantidadeAComprar).toBe(1500);
  });

  it('marca sem preço quando o valor unitário é zero', () => {
    const item = itemDeFaltante(faltante({ valorUnitario: centavos(0) }));
    expect(item.semPreco).toBe(true);
    expect(item.custo).toBe(0);
  });

  it('produto com fator de conversão exibe pacotes e excedente estimado', () => {
    const item = itemDeFaltante(
      faltante({
        unidade: 'un',
        quantidadeAtual: milesimos(6000),
        quantidadeNecessaria: milesimos(12000),
        fatorConversaoEmbalagem: fatorConversao(12),
      }),
    );
    if (item.tipo !== 'produto') {
      throw new Error('esperado item de produto');
    }
    expect(item.pacotes).toBe(1);
    expect(item.quantidadeAComprar).toBe(12000);
    expect(item.quantidadeFinalEstimada).toBe(18000); // 6 + 12
  });

  it('produto com fator de conversão sem excedente não indica quantidade final', () => {
    const item = itemDeFaltante(
      faltante({
        unidade: 'un',
        quantidadeAtual: milesimos(0),
        quantidadeNecessaria: milesimos(12000),
        fatorConversaoEmbalagem: fatorConversao(12),
      }),
    );
    if (item.tipo !== 'produto') {
      throw new Error('esperado item de produto');
    }
    expect(item.pacotes).toBe(1);
    expect(item.quantidadeFinalEstimada).toBeNull();
  });

  it('produto com embalagem usa o preço do pacote, não a multiplicação do valor unitário arredondado (achado em produção: pacote de 6 a R$10,00 não pode virar R$10,02)', () => {
    const item = itemDeFaltante(
      faltante({
        unidade: 'un',
        quantidadeAtual: milesimos(0),
        quantidadeNecessaria: milesimos(6000),
        fatorConversaoEmbalagem: fatorConversao(6),
        valorReferenciaEmbalagem: centavos(1000),
        valorUnitario: centavos(167), // 1000/6 arredondado — não pode ser usado pro custo total
      }),
    );
    if (item.tipo !== 'produto') {
      throw new Error('esperado item de produto');
    }
    expect(item.pacotes).toBe(1);
    expect(item.custo).toBe(1000);
    expect(item.semPreco).toBe(false);
  });

  it('produto sem fator não indica pacotes', () => {
    const item = itemDeFaltante(faltante());
    if (item.tipo !== 'produto') {
      throw new Error('esperado item de produto');
    }
    expect(item.pacotes).toBeNull();
    expect(item.quantidadeFinalEstimada).toBeNull();
  });
});

describe('itemDeAvulso', () => {
  it('usa a quantidade planejada direto, sem arredondamento', () => {
    const item = itemDeAvulso(avulso({ quantidadePlanejada: milesimos(2500) }));
    expect(item.quantidadeAComprar).toBe(2500);
  });

  it('calcula custo quando há preço estimado', () => {
    const item = itemDeAvulso(
      avulso({ quantidadePlanejada: milesimos(2000), valorEstimadoUnit: centavos(1800) }),
    );
    expect(item.custo).toBe(3600);
    expect(item.semPreco).toBe(false);
  });

  it('marca sem preço quando não há valor estimado', () => {
    const item = itemDeAvulso(avulso({ valorEstimadoUnit: centavos(0) }));
    expect(item.semPreco).toBe(true);
  });
});

describe('compuserLista', () => {
  it('combina faltantes e avulsos', () => {
    const itens = compuserLista([faltante({ id: 'p1' })], [avulso({ id: 'a1' })], new Set());
    expect(itens.map((i) => i.tipo)).toEqual(['produto', 'avulso']);
  });

  it('subtrai os faltantes marcados como excluídos', () => {
    const itens = compuserLista(
      [faltante({ id: 'p1' }), faltante({ id: 'p2' })],
      [],
      new Set(['p1']),
    );
    expect(itens).toHaveLength(1);
    expect((itens[0] as { produtoId: string }).produtoId).toBe('p2');
  });

  it('lista vazia quando não há faltante nem avulso', () => {
    expect(compuserLista([], [], new Set())).toEqual([]);
  });
});

describe('totalDaListaDeCompras', () => {
  it('soma apenas os itens com preço e conta os sem preço', () => {
    const itens = [
      itemDeFaltante(faltante({ id: 'p1', valorUnitario: centavos(890) })),
      itemDeFaltante(faltante({ id: 'p2', valorUnitario: centavos(0) })),
      itemDeAvulso(avulso({ id: 'a1', valorEstimadoUnit: centavos(0) })),
    ];
    const total = totalDaListaDeCompras(itens);
    expect(total.contagemItens).toBe(3);
    expect(total.contagemSemPreco).toBe(2);
    expect(total.total).toBe(itens[0].custo);
  });

  it('lista inteiramente sem preço soma zero e conta todos os itens', () => {
    const itens = [
      itemDeFaltante(faltante({ valorUnitario: centavos(0) })),
      itemDeAvulso(avulso({ valorEstimadoUnit: centavos(0) })),
    ];
    const total = totalDaListaDeCompras(itens);
    expect(total.total).toBe(0);
    expect(total.contagemSemPreco).toBe(2);
  });
});
