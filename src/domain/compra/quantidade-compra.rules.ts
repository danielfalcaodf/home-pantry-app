import { FatorConversao } from '../produto/conversao-embalagem.rules';
import { Milesimos, milesimos } from '../shared/quantidade';
import { Unidade } from '../shared/unidade';

// Passo de 1 unidade inteira (1 un ou 1 kg) — quem mede em kg no mercado
// anda em quilos inteiros; fração exata vai pelo teclado.
//
// Item com fator de conversão (achado pós-exploração, 2026-09-05, ver
// design.md): o passo vira o fator inteiro de unidades, nunca 1 — uma
// quantidade que não é múltiplo do fator não corresponde a nenhuma compra
// possível no mercado (rompe a mesma regra que `quantidadeAComprarComFator`
// já impõe na lista).
export function passoRapido(_unidade: Unidade, fator?: FatorConversao | null): Milesimos {
  if (fator !== undefined && fator !== null) {
    return milesimos(fator * 1000);
  }
  return milesimos(1000);
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
