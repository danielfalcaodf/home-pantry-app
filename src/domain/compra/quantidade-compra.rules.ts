import { Milesimos, milesimos } from '../shared/quantidade';
import { ehIndivisivel, Unidade } from '../shared/unidade';

export function passoRapido(unidade: Unidade): Milesimos {
  return milesimos(ehIndivisivel(unidade) ? 1000 : 100);
}

export function ajustarQuantidadeRapida(
  atual: Milesimos,
  unidade: Unidade,
  direcao: -1 | 1,
): Milesimos {
  const passo = passoRapido(unidade);
  return milesimos(Math.max(passo, atual + passo * direcao));
}
