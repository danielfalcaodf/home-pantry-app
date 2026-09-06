import { fatorConversao } from './conversao-embalagem.rules';
import { centavos } from '../shared/dinheiro';
import { milesimos } from '../shared/quantidade';
import { Unidade } from '../shared/unidade';
import {
  alturaDoNivel,
  custoReposicao,
  detalheDaQuantidadeAComprar,
  emFalta,
  estadoDoItem,
  quantidadeAComprar,
  rotuloDoItem,
  totalDaLista,
  valorEmEstoque,
} from './estoque.rules';

function dados(
  atual: number,
  necessaria: number,
  unidade: Unidade = 'un',
  valorUnitario = 0,
  fatorConversaoEmbalagem: number | null = null,
) {
  return {
    unidade,
    quantidadeAtual: milesimos(atual),
    quantidadeNecessaria: milesimos(necessaria),
    valorUnitario: centavos(valorUnitario),
    fatorConversaoEmbalagem:
      fatorConversaoEmbalagem === null ? null : fatorConversao(fatorConversaoEmbalagem),
  };
}

describe('estadoDoItem', () => {
  it('zerado é crítico', () => {
    expect(estadoDoItem(dados(0, 3000))).toBe('critico');
  });

  it('abaixo do mínimo está em falta', () => {
    expect(estadoDoItem(dados(2000, 3000))).toBe('emFalta');
  });

  it('no mínimo exato está ok', () => {
    expect(estadoDoItem(dados(3000, 3000))).toBe('ok');
  });

  it('acima do mínimo está ok', () => {
    expect(estadoDoItem(dados(5000, 2000))).toBe('ok');
  });
});

describe('emFalta', () => {
  it('vale para zerado e para parcial, não para completo', () => {
    expect(emFalta(dados(0, 3000))).toBe(true);
    expect(emFalta(dados(2000, 3000))).toBe(true);
    expect(emFalta(dados(3000, 3000))).toBe(false);
  });
});

describe('quantidadeAComprar', () => {
  it('falta simples em unidade divisível', () => {
    expect(quantidadeAComprar(dados(500, 2000, 'kg'))).toBe(1500);
  });

  it('falta fracionária em unidade indivisível arredonda para cima', () => {
    expect(quantidadeAComprar(dados(2500, 3000, 'pacote'))).toBe(1000);
  });

  it('item ok não gera quantidade a comprar', () => {
    expect(quantidadeAComprar(dados(5000, 2000, 'un'))).toBe(0);
  });

  it('item zerado compra o necessário inteiro', () => {
    expect(quantidadeAComprar(dados(0, 3000, 'un'))).toBe(3000);
  });

  it('produto com fator arredonda para o múltiplo do pacote', () => {
    expect(quantidadeAComprar(dados(6000, 12000, 'un', 0, 12))).toBe(12000);
  });
});

describe('detalheDaQuantidadeAComprar', () => {
  it('produto sem fator não indica pacotes nem excedente', () => {
    expect(detalheDaQuantidadeAComprar(dados(2500, 3000, 'pacote'))).toEqual({
      quantidade: 1000,
      pacotes: null,
      excedente: 0,
    });
  });

  it('produto com fator indica pacotes e excedente', () => {
    expect(detalheDaQuantidadeAComprar(dados(6000, 12000, 'un', 0, 12))).toEqual({
      quantidade: 12000,
      pacotes: 1,
      excedente: 6000,
    });
  });

  it('falta exata em múltiplo do fator não gera excedente', () => {
    expect(detalheDaQuantidadeAComprar(dados(0, 12000, 'un', 0, 12))).toEqual({
      quantidade: 12000,
      pacotes: 1,
      excedente: 0,
    });
  });
});

describe('custoReposicao e valorEmEstoque', () => {
  it('custo com preço cadastrado', () => {
    const { custo, semPreco } = custoReposicao(dados(0, 2000, 'un', 890));
    expect(custo).toBe(1780);
    expect(semPreco).toBe(false);
  });

  it('item sem preço tem custo 0 e é sinalizado como sem preço', () => {
    const { custo, semPreco } = custoReposicao(dados(0, 2000, 'un', 0));
    expect(custo).toBe(0);
    expect(semPreco).toBe(true);
  });

  it('valor em estoque usa a conversão única', () => {
    expect(valorEmEstoque(dados(3000, 3000, 'un', 1290))).toBe(3870);
  });
});

describe('totalDaLista', () => {
  it('item sem preço não corrompe o total e é contado à parte', () => {
    const lista = [
      dados(0, 2000, 'un', 890), // custo 1780
      dados(0, 1000, 'un', 0), // sem preço
      dados(500, 2000, 'kg', 1000), // custo 1500
    ];
    const { total, itensSemPreco } = totalDaLista(lista);
    expect(total).toBe(3280);
    expect(itensSemPreco).toBe(1);
  });

  it('lista vazia soma zero', () => {
    expect(totalDaLista([])).toEqual({ total: 0, itensSemPreco: 0 });
  });
});

describe('alturaDoNivel', () => {
  it('fração parcial', () => {
    const { fracao, temSobra } = alturaDoNivel(dados(2000, 3000));
    expect(fracao).toBeCloseTo(0.667, 2);
    expect(temSobra).toBe(false);
  });

  it('item acima do necessário não transborda e sinaliza sobra', () => {
    const { fracao, temSobra } = alturaDoNivel(dados(5000, 2000));
    expect(fracao).toBe(1);
    expect(temSobra).toBe(true);
  });

  it('item exatamente cheio não tem sobra', () => {
    const { fracao, temSobra } = alturaDoNivel(dados(2000, 2000));
    expect(fracao).toBe(1);
    expect(temSobra).toBe(false);
  });

  it('item zerado não tem preenchimento', () => {
    expect(alturaDoNivel(dados(0, 3000)).fracao).toBe(0);
  });

  it('quantidade necessária 0 retorna fração 0 sem lançar', () => {
    expect(() => alturaDoNivel(dados(1000, 0))).not.toThrow();
    expect(alturaDoNivel(dados(1000, 0))).toEqual({ fracao: 0, temSobra: false });
  });
});

describe('rotuloDoItem', () => {
  it('zerado é "Acabou"', () => {
    expect(rotuloDoItem(dados(0, 3000))).toBe('Acabou');
  });

  it('em falta indica quanto falta: "Falta 1" para 1000 milésimos de pacote', () => {
    expect(rotuloDoItem(dados(2000, 3000, 'pacote'))).toBe('Falta 1');
  });

  it('em falta com unidade divisível formata a fração: "Falta 0,5"', () => {
    expect(rotuloDoItem(dados(1500, 2000, 'kg'))).toBe('Falta 0,5');
  });

  it('completo é "Cheio"', () => {
    expect(rotuloDoItem(dados(3000, 3000))).toBe('Cheio');
  });

  it('nenhum rótulo contém vocabulário de sistema', () => {
    const rotulos = [
      rotuloDoItem(dados(0, 3000)),
      rotuloDoItem(dados(2000, 3000)),
      rotuloDoItem(dados(3000, 3000)),
    ];
    for (const rotulo of rotulos) {
      expect(rotulo.toLowerCase()).not.toMatch(/dar baixa|movimento|reposi/);
    }
  });
});
