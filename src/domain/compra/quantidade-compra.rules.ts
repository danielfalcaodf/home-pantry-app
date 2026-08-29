import { Milesimos, milesimos } from '../shared/quantidade';
import { ehIndivisivel, Unidade } from '../shared/unidade';

// Achado de QA: um passo fixo de 0,1 (100 milésimos) pra toda unidade
// divisível dava 100g/100ml corretos, mas 0,1kg/0,1L — no mercado, quem
// mede em kg/L quer andar em unidades inteiras, e quem mede em g/ml quer
// andar de 100 em 100 (a granularidade que faz sentido pra cada grandeza,
// não uma fração cega de "1000 milésimos").
export function passoRapido(unidade: Unidade): Milesimos {
  if (ehIndivisivel(unidade)) {
    return milesimos(1000); // 1 unidade inteira (un, pacote, caixa)
  }
  if (unidade === 'kg' || unidade === 'L') {
    return milesimos(1000); // 1 kg ou 1 L inteiro
  }
  return milesimos(100000); // g/ml: 100 de cada vez
}

export function ajustarQuantidadeRapida(
  atual: Milesimos,
  unidade: Unidade,
  direcao: -1 | 1,
): Milesimos {
  const passo = passoRapido(unidade);
  return milesimos(Math.max(passo, atual + passo * direcao));
}
