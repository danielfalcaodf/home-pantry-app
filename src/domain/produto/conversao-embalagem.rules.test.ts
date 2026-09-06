import { centavos } from '../shared/dinheiro';
import { milesimos } from '../shared/quantidade';
import {
  custoEstimadoComFator,
  derivarComPacotes,
  fatorConversao,
  quantidadeAComprarComFator,
  rotuloDoPacote,
  validarFatorConversao,
  valorUnitarioDoPacote,
} from './conversao-embalagem.rules';

describe('validarFatorConversao', () => {
  it('aceita fator em unidade indivisível', () => {
    const resultado = validarFatorConversao('un', 12);
    expect(resultado.ok).toBe(true);
    expect(resultado.ok && resultado.valor).toBe(12);
  });

  it('rejeita fator em unidade divisível', () => {
    const resultado = validarFatorConversao('kg', 6);
    expect(resultado.ok).toBe(false);
  });

  it('fator é opcional: null/undefined não é erro', () => {
    expect(validarFatorConversao('un', null)).toEqual({ ok: true, valor: null });
    expect(validarFatorConversao('un', undefined)).toEqual({ ok: true, valor: null });
  });

  it('rejeita fator zero ou negativo', () => {
    expect(validarFatorConversao('un', 0).ok).toBe(false);
    expect(validarFatorConversao('un', -3).ok).toBe(false);
  });

  it('rejeita fator não inteiro', () => {
    expect(validarFatorConversao('un', 2.5).ok).toBe(false);
  });
});

describe('rotuloDoPacote', () => {
  it('compõe o rótulo a partir do fator', () => {
    expect(rotuloDoPacote(fatorConversao(12))).toBe('Vem em pacotes de 12');
  });

  it('produto sem fator não tem rótulo', () => {
    expect(rotuloDoPacote(null)).toBeNull();
  });
});

describe('valorUnitarioDoPacote', () => {
  it('divisão exata', () => {
    expect(valorUnitarioDoPacote(centavos(1200), fatorConversao(12))).toBe(100);
  });

  it('divisão com resto arredonda ao centavo mais próximo', () => {
    expect(valorUnitarioDoPacote(centavos(1290), fatorConversao(12))).toBe(108);
  });
});

describe('custoEstimadoComFator', () => {
  it('não reintroduz o arredondamento eliminado por valorUnitarioDoPacote (achado em produção: pacote de 6 a R$10,00 não pode virar R$10,02)', () => {
    expect(
      custoEstimadoComFator(milesimos(6000), fatorConversao(6), centavos(1000)),
    ).toBe(1000);
  });

  it('escala corretamente para múltiplos pacotes', () => {
    expect(
      custoEstimadoComFator(milesimos(12000), fatorConversao(6), centavos(1000)),
    ).toBe(2000);
  });

  it('proporcional mesmo quando a quantidade não é múltiplo exato do fator (ajuste manual de unidade)', () => {
    expect(
      custoEstimadoComFator(milesimos(3000), fatorConversao(6), centavos(1000)),
    ).toBe(500);
  });
});

describe('quantidadeAComprarComFator', () => {
  it('falta menor que um pacote', () => {
    const resultado = quantidadeAComprarComFator(milesimos(6000), fatorConversao(12));
    expect(resultado).toEqual({ quantidade: 12000, pacotes: 1, excedente: 6000 });
  });

  it('falta exige mais de um pacote', () => {
    const resultado = quantidadeAComprarComFator(milesimos(30000), fatorConversao(12));
    expect(resultado).toEqual({ quantidade: 36000, pacotes: 3, excedente: 6000 });
  });

  it('falta exata em múltiplo do fator não gera excedente', () => {
    const resultado = quantidadeAComprarComFator(milesimos(12000), fatorConversao(12));
    expect(resultado).toEqual({ quantidade: 12000, pacotes: 1, excedente: 0 });
  });

  it('sem falta não compra nada', () => {
    const resultado = quantidadeAComprarComFator(milesimos(0), fatorConversao(12));
    expect(resultado).toEqual({ quantidade: 0, pacotes: 0, excedente: 0 });
  });
});

describe('derivarComPacotes', () => {
  it('tamanho do pacote igual ao cadastrado', () => {
    const resultado = derivarComPacotes(1, fatorConversao(12), centavos(1290));
    expect(resultado).toEqual({ quantidadeComprada: 12000, valorPagoUnitario: 108 });
  });

  it('tamanho do pacote diferente do cadastrado no mercado usa o tamanho real', () => {
    const resultado = derivarComPacotes(1, fatorConversao(16), centavos(1600));
    expect(resultado).toEqual({ quantidadeComprada: 16000, valorPagoUnitario: 100 });
  });

  it('múltiplos pacotes', () => {
    const resultado = derivarComPacotes(2, fatorConversao(12), centavos(2580));
    expect(resultado).toEqual({ quantidadeComprada: 24000, valorPagoUnitario: 108 });
  });
});
