export const UNIDADES = ['un', 'kg', 'g', 'L', 'ml', 'pacote', 'caixa'] as const;

export type Unidade = (typeof UNIDADES)[number];

export function ehUnidade(valor: string): valor is Unidade {
  return (UNIDADES as readonly string[]).includes(valor);
}

// Indivisível: não faz sentido comprar meia unidade — arredonda para cima.
export function ehIndivisivel(unidade: Unidade): boolean {
  return unidade === 'un' || unidade === 'pacote' || unidade === 'caixa';
}

const ROTULOS: Record<Unidade, { singular: string; plural: string }> = {
  un: { singular: 'un', plural: 'un' },
  kg: { singular: 'kg', plural: 'kg' },
  g: { singular: 'g', plural: 'g' },
  L: { singular: 'L', plural: 'L' },
  ml: { singular: 'ml', plural: 'ml' },
  pacote: { singular: 'pacote', plural: 'pacotes' },
  caixa: { singular: 'caixa', plural: 'caixas' },
};

export function rotuloDaUnidade(unidade: Unidade, plural: boolean): string {
  return plural ? ROTULOS[unidade].plural : ROTULOS[unidade].singular;
}
