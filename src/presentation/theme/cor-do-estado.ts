import { TipoMovimento } from '../../domain/movimento/movimento';
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

/** Distinção visual dos três tipos no histórico (task 5.3) — nunca só a cor,
 *  sempre junto do verbo em texto (descreverMovimento). */
export function corDoMovimento(tema: Theme, tipo: TipoMovimento): string {
  if (tipo === 'reposicao') {
    return tema.state.cheio;
  }
  if (tipo === 'ajuste') {
    return tema.action.azulejo;
  }
  return tema.text.primary;
}
