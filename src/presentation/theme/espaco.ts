export const espaco = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// Raio 0 na lista é intencional (FRONTEND §5): a linha vai de borda a borda
// porque é um recipiente cheio de líquido — arredondar reintroduz o card.
export const raio = {
  linha: 0,
  campo: 8,
  sheet: 12,
  pilula: 999,
} as const;

export const ALTURA_ITEM = 68;
export const ALVO_TOQUE_MINIMO = 48;
export const ESPESSURA_REGUA = 2;
export const ESPESSURA_DIVISOR = 1;
