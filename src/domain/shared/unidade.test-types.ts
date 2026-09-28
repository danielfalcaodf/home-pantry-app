import { Unidade } from './unidade';

/**
 * ACHADO-010: `Unidade` é um conjunto fechado (`UNIDADES as const`), mas
 * nada provava que o compilador rejeita um valor fora dele. Verificado só
 * por `tsc --noEmit`.
 */
// @ts-expect-error — 'tonelada' não pertence ao conjunto fechado de Unidade.
const foraDoConjunto: Unidade = 'tonelada';

// @ts-expect-error — 'g' saiu do conjunto na redução a un/kg (migration 0005).
const gramaRemovida: Unidade = 'g';

// @ts-expect-error — 'pacote' saiu do conjunto; embalagem é o fator de `un`.
const pacoteRemovido: Unidade = 'pacote';

const dentroDoConjunto: Unidade = 'kg';

void foraDoConjunto;
void gramaRemovida;
void pacoteRemovido;
void dentroDoConjunto;
