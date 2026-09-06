import { ItemDaLista } from '../../domain/lista/lista';
import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { agruparListaPorCategoria, listaContinua } from './agrupar-lista';

function produto(sobrescreve: Partial<Extract<ItemDaLista, { tipo: 'produto' }>> = {}): ItemDaLista {
  return {
    tipo: 'produto',
    produtoId: 'p1',
    nome: 'Arroz',
    categoria: 'Grãos',
    unidade: 'pacote',
    quantidadeAComprar: milesimos(1000),
    valorUnitario: centavos(890),
    custo: centavos(890),
    semPreco: false,
    pacotes: null,
    quantidadeFinalEstimada: null,
    ...sobrescreve,
  };
}

function avulso(sobrescreve: Partial<Extract<ItemDaLista, { tipo: 'avulso' }>> = {}): ItemDaLista {
  return {
    tipo: 'avulso',
    itemId: 'a1',
    nome: 'Carvão',
    categoria: null,
    unidade: 'un',
    quantidadeAComprar: milesimos(1000),
    valorUnitario: centavos(1800),
    custo: centavos(1800),
    semPreco: false,
    ...sobrescreve,
  };
}

describe('agruparListaPorCategoria', () => {
  it('grupos em ordem alfabética, itens ordenados por nome dentro do grupo', () => {
    const itens = [
      produto({ produtoId: 'p1', nome: 'Feijão', categoria: 'Grãos' }),
      produto({ produtoId: 'p2', nome: 'Arroz', categoria: 'Grãos' }),
      produto({ produtoId: 'p3', nome: 'Detergente', categoria: 'Limpeza' }),
    ];

    const linhas = agruparListaPorCategoria(itens);

    expect(linhas.map((l) => (l.tipo === 'cabecalho' ? l.categoria : l.item.nome))).toEqual([
      'Grãos',
      'Arroz',
      'Feijão',
      'Limpeza',
      'Detergente',
    ]);
  });

  it('grupo "Sem categoria" aparece por último mesmo com categorias alfabeticamente posteriores', () => {
    const itens = [
      produto({ produtoId: 'p1', nome: 'Vinagre', categoria: 'Zelo' }),
      avulso({ itemId: 'a1', nome: 'Pilha' }),
      produto({ produtoId: 'p2', nome: 'Arroz', categoria: 'Grãos' }),
    ];

    const linhas = agruparListaPorCategoria(itens);
    const cabecalhos = linhas.filter((l) => l.tipo === 'cabecalho').map((l) => l.categoria);

    expect(cabecalhos).toEqual(['Grãos', 'Zelo', 'Sem categoria']);
  });

  it('item com categoria vazia cai no grupo "Sem categoria"', () => {
    const itens = [produto({ produtoId: 'p1', nome: 'Arroz', categoria: null })];

    const linhas = agruparListaPorCategoria(itens);

    expect(linhas[0]).toMatchObject({ tipo: 'cabecalho', categoria: 'Sem categoria' });
  });
});

describe('listaContinua', () => {
  it('ordena por nome, sem cabeçalhos, com avulsos misturados a produtos', () => {
    const itens = [
      produto({ produtoId: 'p1', nome: 'Feijão', categoria: 'Grãos' }),
      avulso({ itemId: 'a1', nome: 'Carvão' }),
      produto({ produtoId: 'p2', nome: 'Detergente', categoria: 'Limpeza' }),
    ];

    const linhas = listaContinua(itens);

    expect(linhas.every((l) => l.tipo === 'item')).toBe(true);
    expect(linhas.map((l) => (l.tipo === 'item' ? l.item.nome : ''))).toEqual([
      'Carvão',
      'Detergente',
      'Feijão',
    ]);
  });
});
