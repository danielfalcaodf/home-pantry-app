import { milesimos } from '../shared/quantidade';

import { ajustarQuantidadeRapida } from './quantidade-compra.rules';

describe('ajustarQuantidadeRapida', () => {
  it.each([
    ['un', milesimos(2000), 1, milesimos(3000)],
    ['pacote', milesimos(2000), 1, milesimos(3000)],
    ['caixa', milesimos(2000), -1, milesimos(1000)],
    ['kg', milesimos(500), 1, milesimos(600)],
    ['g', milesimos(500), -1, milesimos(400)],
    ['L', milesimos(500), 1, milesimos(600)],
    ['ml', milesimos(500), -1, milesimos(400)],
  ] as const)('%s altera pelo passo da unidade', (unidade, atual, direcao, esperado) => {
    expect(ajustarQuantidadeRapida(atual, unidade, direcao)).toBe(esperado);
  });

  it.each(['un', 'pacote', 'caixa'] as const)('%s nunca reduz abaixo de uma unidade', (unidade) => {
    expect(ajustarQuantidadeRapida(milesimos(1000), unidade, -1)).toBe(1000);
  });

  it.each(['kg', 'g', 'L', 'ml'] as const)('%s nunca reduz abaixo de 100 milésimos', (unidade) => {
    expect(ajustarQuantidadeRapida(milesimos(100), unidade, -1)).toBe(100);
  });
});
