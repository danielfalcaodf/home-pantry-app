import { Milesimos } from './quantidade';

// Dinheiro sempre em centavos inteiros: R$ 12,90 = 1290. Nunca float.
export type Centavos = number & { readonly __marca: 'centavos' };

export function centavos(n: number): Centavos {
  return Math.trunc(n) as Centavos;
}

export function deTextoDigitado(texto: string): Centavos {
  const limpo = texto.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '');
  const normalizado = limpo.replace(',', '.');
  const valor = Number.parseFloat(normalizado);
  if (Number.isNaN(valor)) {
    return centavos(0);
  }
  return centavos(Math.round(valor * 100));
}

export function formatarBRL(c: Centavos): string {
  const negativo = c < 0;
  const absoluto = Math.abs(c);
  const reais = Math.trunc(absoluto / 100);
  const resto = String(absoluto % 100).padStart(2, '0');
  const inteiro = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negativo ? '-' : ''}R$ ${inteiro},${resto}`;
}

// A ÚNICA divisão de um bruto milésimos·centavos → centavos do projeto.
// Sem ela, quantidade_atual × valor_unitario produz um valor 1000× maior.
export function converterValorBruto(bruto: number): Centavos {
  return centavos(Math.round(bruto / 1000));
}

// A ÚNICA conversão de milésimos × centavos → centavos do projeto — usada
// tanto para um item quanto para um bruto já somado por SQL (DATABASE §6.5),
// que chega aqui como `quantidade * preco` de uma casa inteira.
export function multiplicarQuantidadePorPreco(quantidade: Milesimos, preco: Centavos): Centavos {
  return converterValorBruto(quantidade * preco);
}
