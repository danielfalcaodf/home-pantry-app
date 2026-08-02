import { ehIndivisivel, rotuloDaUnidade, Unidade } from './unidade';

// Quantidade sempre em milésimos inteiros: 1,5 kg = 1500. Nunca float.
export type Milesimos = number & { readonly __marca: 'milesimos' };

export function milesimos(n: number): Milesimos {
  return Math.trunc(n) as Milesimos;
}

export function deDecimal(valor: number): Milesimos {
  return milesimos(Math.round(valor * 1000));
}

export function paraDecimal(m: Milesimos): number {
  return m / 1000;
}

// "1,5" e não "1,500"; "2" e não "2,000". Vírgula como separador decimal.
export function formatarNumero(m: Milesimos): string {
  const negativo = m < 0;
  const absoluto = Math.abs(m);
  const inteira = Math.trunc(absoluto / 1000);
  const fracao = absoluto % 1000;
  const sufixo =
    fracao === 0 ? '' : `,${String(fracao).padStart(3, '0').replace(/0+$/, '')}`;
  return `${negativo ? '-' : ''}${inteira}${sufixo}`;
}

export function formatarQuantidade(m: Milesimos, unidade: Unidade): string {
  const plural = Math.abs(m) !== 1000;
  return `${formatarNumero(m)} ${rotuloDaUnidade(unidade, plural)}`;
}

// Arredonda para cima só em unidade indivisível; divisível preserva a fração.
export function arredondarParaUnidade(m: Milesimos, unidade: Unidade): Milesimos {
  if (!ehIndivisivel(unidade)) {
    return m;
  }
  return milesimos(Math.ceil(m / 1000) * 1000);
}
