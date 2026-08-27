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
});
