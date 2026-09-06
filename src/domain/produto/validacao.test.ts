import { validarCadastroProduto } from './validacao';

describe('validarCadastroProduto', () => {
  it('cadastro válido aplica padrões de quantidade atual 0 e valor unitário 0', () => {
    const resultado = validarCadastroProduto({
      nome: 'Arroz',
      unidade: 'pacote',
      quantidadeNecessaria: 2,
    });
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor).toEqual({
        nome: 'Arroz',
        unidade: 'pacote',
        quantidadeNecessaria: 2000,
        quantidadeAtual: 0,
        valorUnitario: 0,
        categoria: null,
        marcaPreferida: null,
        observacao: null,
        fatorConversaoEmbalagem: null,
        valorReferenciaEmbalagem: null,
      });
    }
  });

  it('nome só de espaços é rejeitado apontando o campo nome', () => {
    const resultado = validarCadastroProduto({
      nome: '   ',
      unidade: 'un',
      quantidadeNecessaria: 1,
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro.campo).toBe('nome');
    }
  });

  it('unidade fora do conjunto é rejeitada', () => {
    const resultado = validarCadastroProduto({
      nome: 'Arroz',
      unidade: 'tonelada',
      quantidadeNecessaria: 1,
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro.campo).toBe('unidade');
    }
  });

  it('quantidade necessária zero é rejeitada', () => {
    const resultado = validarCadastroProduto({
      nome: 'Arroz',
      unidade: 'un',
      quantidadeNecessaria: 0,
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro.campo).toBe('quantidadeNecessaria');
    }
  });

  it('quantidade necessária decimal é aceita e vira milésimos', () => {
    const resultado = validarCadastroProduto({
      nome: 'Feijão',
      unidade: 'kg',
      quantidadeNecessaria: 1.5,
    });
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor.quantidadeNecessaria).toBe(1500);
    }
  });

  it('valor unitário negativo é rejeitado', () => {
    const resultado = validarCadastroProduto({
      nome: 'Arroz',
      unidade: 'un',
      quantidadeNecessaria: 1,
      valorUnitario: -100,
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro.campo).toBe('valorUnitario');
    }
  });

  it('categoria fornecida é normalizada na validação', () => {
    const resultado = validarCadastroProduto({
      nome: 'Sabão',
      unidade: 'un',
      quantidadeNecessaria: 1,
      categoria: ' limpeza  pesada ',
    });
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor.categoria).toBe('Limpeza pesada');
    }
  });

  it('fator e valor do pacote derivam o valor unitário sem exigir digitação direta', () => {
    const resultado = validarCadastroProduto({
      nome: 'Papel higiênico',
      unidade: 'un',
      quantidadeNecessaria: 12,
      fatorConversaoEmbalagem: 12,
      valorReferenciaEmbalagem: 12.9,
    });
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor.fatorConversaoEmbalagem).toBe(12);
      expect(resultado.valor.valorReferenciaEmbalagem).toBe(1290);
      expect(resultado.valor.valorUnitario).toBe(108);
    }
  });

  it('fator de conversão em unidade divisível é rejeitado', () => {
    const resultado = validarCadastroProduto({
      nome: 'Arroz',
      unidade: 'kg',
      quantidadeNecessaria: 5,
      fatorConversaoEmbalagem: 6,
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro.campo).toBe('fatorConversaoEmbalagem');
    }
  });

  it('cadastro sem embalagem continua igual a hoje', () => {
    const resultado = validarCadastroProduto({
      nome: 'Sabonete',
      unidade: 'un',
      quantidadeNecessaria: 3,
    });
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor.fatorConversaoEmbalagem).toBeNull();
      expect(resultado.valor.valorReferenciaEmbalagem).toBeNull();
    }
  });
});
