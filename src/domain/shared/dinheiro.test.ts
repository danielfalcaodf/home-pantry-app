import { milesimos } from './quantidade';
import {
  centavos,
  converterValorBruto,
  deTextoDigitado,
  formatarBRL,
  multiplicarQuantidadePorPreco,
} from './dinheiro';

describe('formatação BRL', () => {
  it('formata 1290 centavos como "R$ 12,90"', () => {
    expect(formatarBRL(centavos(1290))).toBe('R$ 12,90');
  });

  it('formata zero explicitamente', () => {
    expect(formatarBRL(centavos(0))).toBe('R$ 0,00');
  });

  it('separa milhares com ponto', () => {
    expect(formatarBRL(centavos(123456))).toBe('R$ 1.234,56');
  });
});

describe('conversão de texto digitado', () => {
  it('converte "12,90" para 1290 centavos', () => {
    expect(deTextoDigitado('12,90')).toBe(1290);
  });

  it('aceita valor sem casas decimais', () => {
    expect(deTextoDigitado('12')).toBe(1200);
  });

  it('aceita prefixo R$ e espaços', () => {
    expect(deTextoDigitado('R$ 12,90')).toBe(1290);
  });

  it('texto inválido vira zero', () => {
    expect(deTextoDigitado('abc')).toBe(0);
  });
});

describe('multiplicarQuantidadePorPreco — a única conversão milésimos × centavos', () => {
  it('2000 milésimos a 1290 centavos custam 2580 centavos, não 2.580.000', () => {
    expect(multiplicarQuantidadePorPreco(milesimos(2000), centavos(1290))).toBe(2580);
  });

  it('quantidade fracionária: 500 milésimos a 1000 centavos custam 500 centavos', () => {
    expect(multiplicarQuantidadePorPreco(milesimos(500), centavos(1000))).toBe(500);
  });

  it('fração de centavo é arredondada ao centavo mais próximo', () => {
    expect(multiplicarQuantidadePorPreco(milesimos(333), centavos(100))).toBe(33);
    expect(multiplicarQuantidadePorPreco(milesimos(335), centavos(100))).toBe(34);
  });

  it('valor zero produz zero', () => {
    expect(multiplicarQuantidadePorPreco(milesimos(2000), centavos(0))).toBe(0);
    expect(multiplicarQuantidadePorPreco(milesimos(0), centavos(1290))).toBe(0);
  });
});

describe('converterValorBruto — a única divisão de um bruto já somado por SQL', () => {
  it('divide por mil um bruto de dois itens, não produz o valor mil vezes maior', () => {
    // DATABASE §6.5: SUM(quantidade_atual * valor_unitario) de dois itens.
    const bruto = 2000 * 1290 + 3000 * 2250; // 2.580.000 + 6.750.000
    expect(converterValorBruto(bruto)).toBe(9330); // R$ 93,30, não R$ 93.300,00
  });

  it('produz o mesmo resultado que somar os itens já convertidos individualmente', () => {
    const itens = [
      { quantidade: milesimos(2000), preco: centavos(1290) },
      { quantidade: milesimos(3000), preco: centavos(2250) },
    ];
    const somaIndividual = itens.reduce(
      (total, item) => total + multiplicarQuantidadePorPreco(item.quantidade, item.preco),
      0,
    );
    const bruto = itens.reduce((total, item) => total + item.quantidade * item.preco, 0);
    expect(converterValorBruto(bruto)).toBe(somaIndividual);
  });

  it('bruto zero produz zero', () => {
    expect(converterValorBruto(0)).toBe(0);
  });
});
