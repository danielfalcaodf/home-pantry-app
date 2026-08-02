import { Theme } from './tokens';

/** Estado do domínio (`ok`) ↔ token do tema (`cheio`) — nomes diferentes por
 *  origem diferente: um é regra, o outro é vocabulário visual. */
export type EstadoVisual = 'critico' | 'emFalta' | 'ok';

export function corDoEstado(tema: Theme, estado: EstadoVisual): string {
  if (estado === 'ok') {
    return tema.state.cheio;
  }
  return tema.state[estado];
}
