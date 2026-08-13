import { Result } from './result';

/**
 * ACHADO-009: `Result<T,E>` é uma união discriminada por `.ok`, mas nada
 * provava que o compilador rejeita acessar `.valor`/`.erro` sem discriminar
 * antes. Verificado só por `tsc --noEmit` — `@ts-expect-error` falha a build
 * se a rejeição parar de acontecer.
 */
function acessoSemDiscriminar(r: Result<number, string>) {
  // @ts-expect-error — `.valor` só existe no ramo `ok: true`, não em Result cru.
  return r.valor;
}

function outroAcessoSemDiscriminar(r: Result<number, string>) {
  // @ts-expect-error — `.erro` só existe no ramo `ok: false`, não em Result cru.
  return r.erro;
}

function acessoCorretoComDiscriminacao(r: Result<number, string>): number | string {
  return r.ok ? r.valor : r.erro;
}

void acessoSemDiscriminar;
void outroAcessoSemDiscriminar;
void acessoCorretoComDiscriminacao;
