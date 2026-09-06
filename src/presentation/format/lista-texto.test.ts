import { ItemDaLista } from '../../domain/lista/lista';
import { totalDaListaDeCompras } from '../../domain/lista/lista.rules';
import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { gerarTextoDaLista } from './lista-texto';

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

describe('gerarTextoDaLista', () => {
  it('lista vazia gera texto vazio', () => {
    expect(gerarTextoDaLista([], false, totalDaListaDeCompras([]))).toBe('');
  });

  it('contém nome, quantidade e o total ao final, em lista contínua', () => {
    const itens = [produto()];
    const texto = gerarTextoDaLista(itens, false, totalDaListaDeCompras(itens));
    expect(texto).toContain('Arroz');
    expect(texto).toContain('1 pacote');
    expect(texto).toContain('Total estimado: R$ 8,90');
  });

  it('sinaliza itens sem preço e não os inclui no total', () => {
    const itens = [
      produto(),
      produto({ produtoId: 'p2', nome: 'Sabão', semPreco: true, custo: centavos(0) }),
    ];
    const texto = gerarTextoDaLista(itens, false, totalDaListaDeCompras(itens));
    expect(texto).toContain('Sabão — 1 pacote — sem preço');
    expect(texto).toContain('sem preço cadastrado');
  });

  it('agrupamento por categoria separa os itens com cabeçalho', () => {
    const itens = [
      produto({ produtoId: 'p1', nome: 'Arroz', categoria: 'Grãos' }),
      avulso({ nome: 'Carvão' }),
    ];
    const texto = gerarTextoDaLista(itens, true, totalDaListaDeCompras(itens));
    expect(texto).toContain('GRÃOS');
    expect(texto).toContain('SEM CATEGORIA');
    expect(texto).toContain('Carvão (avulso)');
  });

  it('não contém identificadores internos', () => {
    const itens = [produto()];
    const texto = gerarTextoDaLista(itens, false, totalDaListaDeCompras(itens));
    expect(texto).not.toContain('produtoId');
    expect(texto).not.toContain('p1');
  });
});
