// Duas famílias, quatro pesos. Archivo (display) foi removida por orçamento
// de bundle — ver a nota em FRONTEND §4.2. Os papéis de display continuam
// existindo como papéis; mudou só a família que os desenha.
export const familias = {
  sans400: 'IBMPlexSans_400Regular',
  sans500: 'IBMPlexSans_500Medium',
  mono400: 'IBMPlexMono_400Regular',
  mono500: 'IBMPlexMono_500Medium',
} as const;

export type PapelTipografico =
  | 'display.lg'
  | 'display.sm'
  | 'body.lg'
  | 'body.md'
  | 'label'
  | 'caption'
  | 'data.xl'
  | 'data.lg'
  | 'data.md';

export type EstiloTipografico = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  textTransform?: 'uppercase';
  /** Mono com figuras tabulares: dígitos de largura fixa, a lista não pula. */
  tabular: boolean;
};

// Nada acima de 34pt — números gigantes de dashboard não pertencem ao app.
export const TAMANHO_MAXIMO = 34;

export const tipografia: Record<PapelTipografico, EstiloTipografico> = {
  'display.lg': {
    fontFamily: familias.sans500,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.68, // −2%
    tabular: false,
  },
  'display.sm': {
    fontFamily: familias.sans500,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.48, // −2%
    tabular: false,
  },
  'body.lg': {
    fontFamily: familias.sans500,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0,
    tabular: false,
  },
  'body.md': {
    fontFamily: familias.sans400,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
    tabular: false,
  },
  label: {
    fontFamily: familias.sans500,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    tabular: false,
  },
  caption: {
    fontFamily: familias.sans500,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.44, // +4%
    textTransform: 'uppercase',
    tabular: false,
  },
  // Só a tela Resumo usa este papel (FRONTEND §8.4): "aqui — e só aqui — os
  // números podem ser grandes". Mono e tabular como todo dado, mas no topo
  // da escala — o resto do app nunca precisa de um número deste tamanho.
  'data.xl': {
    fontFamily: familias.mono500,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: 0,
    tabular: true,
  },
  'data.lg': {
    fontFamily: familias.mono500,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0,
    tabular: true,
  },
  'data.md': {
    fontFamily: familias.mono400,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
    tabular: true,
  },
};
