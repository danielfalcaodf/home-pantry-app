export const UNIDADES = ['un', 'kg'] as const;

export type Unidade = (typeof UNIDADES)[number];

export function ehUnidade(valor: string): valor is Unidade {
  return (UNIDADES as readonly string[]).includes(valor);
}

// Indivisível: não faz sentido comprar meia unidade — arredonda para cima.
export function ehIndivisivel(unidade: Unidade): boolean {
  return unidade === 'un';
}

const ROTULOS: Record<Unidade, { singular: string; plural: string }> = {
  un: { singular: 'un', plural: 'un' },
  kg: { singular: 'kg', plural: 'kg' },
};

export function rotuloDaUnidade(unidade: Unidade, plural: boolean): string {
  return plural ? ROTULOS[unidade].plural : ROTULOS[unidade].singular;
}
