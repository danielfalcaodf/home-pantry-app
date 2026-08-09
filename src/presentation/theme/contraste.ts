// Cálculo de contraste WCAG 2.1. Vive junto dos tokens porque é o que
// justifica os valores escolhidos — e é o que o teste usa para travá-los.

export type Rgb = { r: number; g: number; b: number };

export function hexParaRgb(hex: string): Rgb {
  const limpo = hex.replace('#', '');
  return {
    r: Number.parseInt(limpo.slice(0, 2), 16),
    g: Number.parseInt(limpo.slice(2, 4), 16),
    b: Number.parseInt(limpo.slice(4, 6), 16),
  };
}

function canalLinear(valor: number): number {
  const normalizado = valor / 255;
  return normalizado <= 0.03928
    ? normalizado / 12.92
    : ((normalizado + 0.055) / 1.055) ** 2.4;
}

export function luminancia(cor: Rgb): number {
  return (
    0.2126 * canalLinear(cor.r) + 0.7152 * canalLinear(cor.g) + 0.0722 * canalLinear(cor.b)
  );
}

export function razaoDeContraste(corA: string, corB: string): number {
  const a = luminancia(hexParaRgb(corA));
  const b = luminancia(hexParaRgb(corB));
  const clara = Math.max(a, b);
  const escura = Math.min(a, b);
  return (clara + 0.05) / (escura + 0.05);
}

/** Composição alfa: a tinta do nível é a cor de estado sobre o fundo. */
export function sobrepor(corFrente: string, corFundo: string, opacidade: number): string {
  const frente = hexParaRgb(corFrente);
  const fundo = hexParaRgb(corFundo);
  const misturar = (f: number, t: number) => Math.round(f * opacidade + t * (1 - opacidade));
  const emHex = (valor: number) => valor.toString(16).padStart(2, '0');
  return `#${emHex(misturar(frente.r, fundo.r))}${emHex(misturar(frente.g, fundo.g))}${emHex(
    misturar(frente.b, fundo.b),
  )}`;
}
