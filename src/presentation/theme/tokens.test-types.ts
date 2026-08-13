import { Theme } from './tokens';

/**
 * ACHADO-015: `Theme` é um tipo fechado — cada token precisa existir na
 * forma declarada (FRONTEND §mesma forma nos dois temas). Nada provava que
 * o compilador rejeita acesso a uma chave inexistente. Verificado só por
 * `tsc --noEmit`.
 */
function tokenInexistente(tema: Theme) {
  // @ts-expect-error — 'destaque' não é uma chave de Theme.
  return tema.destaque;
}

function tokenExistente(tema: Theme): string {
  return tema.action.azulejo;
}

void tokenInexistente;
void tokenExistente;
