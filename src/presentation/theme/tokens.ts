// ÚNICO arquivo do projeto onde literal hexadecimal de cor é permitido
// (FRONTEND §12.1) — a regra de lint bloqueia hex em qualquer outro lugar.

export type Theme = {
  nome: 'despensa' | 'porcelana';
  bg: {
    base: string;
    surface: string;
    raised: string;
  };
  line: {
    hairline: string;
  };
  text: {
    primary: string;
    secondary: string;
    /** Texto sobre superfície de cor sólida (ação, crítico). */
    onAction: string;
  };
  state: {
    cheio: string;
    emFalta: string;
    critico: string;
  };
  action: {
    azulejo: string;
  };
  /** Opacidade da tinta do nível; a régua usa a cor de estado em 100%. */
  fillOpacity: number;
};

// Armário fechado, luz da geladeira à noite.
export const despensa: Theme = {
  nome: 'despensa',
  bg: {
    base: '#0F1513',
    surface: '#161E1B',
    raised: '#1D2724',
  },
  line: {
    hairline: '#2B3733',
  },
  text: {
    primary: '#E9EFEA',
    secondary: '#98A8A2',
    onAction: '#0F1513',
  },
  state: {
    cheio: '#6FB98C',
    emFalta: '#E7B24E',
    critico: '#EA6247',
  },
  action: {
    azulejo: '#63B4D4',
  },
  fillOpacity: 0.12,
};

// Azulejo e louça, luz de manhã — cinza-esverdeado frio, longe do creme.
export const porcelana: Theme = {
  nome: 'porcelana',
  bg: {
    base: '#F1F4F1',
    surface: '#FFFFFF',
    // Não consta na tabela do FRONTEND §3.2; derivado entre base e surface
    // para manter os dois temas com o mesmo conjunto de chaves.
    raised: '#E7ECE8',
  },
  line: {
    hairline: '#D9E0DB',
  },
  text: {
    primary: '#14201C',
    // FRONTEND §3.2 traz #5A6B65, que passa AA sobre o fundo limpo (5.09) mas
    // cai para 4.38 sobre a tinta do nível — e é sobre a tinta que este texto
    // realmente aparece. Escurecido o mínimo para passar nos dois (pior caso 4.72).
    secondary: '#556661',
    onAction: '#FFFFFF',
  },
  state: {
    cheio: '#276B44',
    emFalta: '#8A6410',
    critico: '#B33A20',
  },
  action: {
    azulejo: '#1C5A78',
  },
  fillOpacity: 0.1,
};

export const temas = { despensa, porcelana } as const;

export type NomeDoTema = keyof typeof temas;
