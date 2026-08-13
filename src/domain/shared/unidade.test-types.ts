import { Unidade } from './unidade';

/**
 * ACHADO-010: `Unidade` é um conjunto fechado (`UNIDADES as const`), mas
 * nada provava que o compilador rejeita um valor fora dele. Verificado só
 * por `tsc --noEmit`.
 */
// @ts-expect-error — 'tonelada' não pertence ao conjunto fechado de Unidade.
const foraDoConjunto: Unidade = 'tonelada';

const dentroDoConjunto: Unidade = 'kg';

void foraDoConjunto;
void dentroDoConjunto;
