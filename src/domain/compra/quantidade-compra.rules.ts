import { FatorConversao } from '../produto/conversao-embalagem.rules';
import { Milesimos, milesimos } from '../shared/quantidade';
import { ehIndivisivel, Unidade } from '../shared/unidade';

// Achado de QA: um passo fixo de 0,1 (100 milésimos) pra toda unidade
// divisível dava 100g/100ml corretos, mas 0,1kg/0,1L — no mercado, quem
// mede em kg/L quer andar em unidades inteiras, e quem mede em g/ml quer
// andar de 100 em 100 (a granularidade que faz sentido pra cada grandeza,
// não uma fração cega de "1000 milésimos").
//
// Item com fator de conversão (achado pós-exploração, 2026-09-05, ver
// design.md): o passo vira o fator inteiro de unidades, nunca 1 — uma
// quantidade que não é múltiplo do fator não corresponde a nenhuma compra
// possível no mercado (rompe a mesma regra que `quantidadeAComprarComFator`
// já impõe na lista).
export function passoRapido(unidade: Unidade, fator?: FatorConversao | null): Milesimos {
  if (fator !== undefined && fator !== null) {
    return milesimos(fator * 1000);
  }
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
  fator?: FatorConversao | null,
): Milesimos {
  const passo = passoRapido(unidade, fator);
  return milesimos(Math.max(passo, atual + passo * direcao));
}
