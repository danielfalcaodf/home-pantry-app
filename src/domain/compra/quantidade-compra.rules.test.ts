import { milesimos } from '../shared/quantidade';

import { ajustarQuantidadeRapida, passoRapido } from './quantidade-compra.rules';

describe('passoRapido', () => {
  it.each([
    ['un', 1000],
    ['pacote', 1000],
    ['caixa', 1000],
    ['kg', 1000],
    ['L', 1000],
    ['g', 100000],
    ['ml', 100000],
  ] as const)('%s tem passo de %i milésimos', (unidade, esperado) => {
    expect(passoRapido(unidade)).toBe(esperado);
  });
});

describe('ajustarQuantidadeRapida', () => {
  it.each([
    ['un', milesimos(2000), 1, milesimos(3000)],
    ['pacote', milesimos(2000), 1, milesimos(3000)],
    ['caixa', milesimos(2000), -1, milesimos(1000)],
    // kg/L: passo de 1 unidade inteira — quem mede em quilo/litro anda 1 a 1.
    ['kg', milesimos(2000), 1, milesimos(3000)],
    ['kg', milesimos(2000), -1, milesimos(1000)],
    ['L', milesimos(2000), 1, milesimos(3000)],
    ['L', milesimos(2000), -1, milesimos(1000)],
    // g/ml: passo de 100 (100 000 milésimos) — quem mede em grama/mililitro
    // anda de 100 em 100, nunca em frações de 0,1g/0,1ml.
    ['g', milesimos(200000), 1, milesimos(300000)],
    ['g', milesimos(200000), -1, milesimos(100000)],
    ['ml', milesimos(200000), 1, milesimos(300000)],
    ['ml', milesimos(200000), -1, milesimos(100000)],
  ] as const)('%s altera pelo passo da unidade', (unidade, atual, direcao, esperado) => {
    expect(ajustarQuantidadeRapida(atual, unidade, direcao)).toBe(esperado);
  });

  it.each(['un', 'pacote', 'caixa'] as const)('%s nunca reduz abaixo de uma unidade', (unidade) => {
    expect(ajustarQuantidadeRapida(milesimos(1000), unidade, -1)).toBe(1000);
  });

  it.each(['kg', 'L'] as const)('%s nunca reduz abaixo de 1 unidade inteira (1000 milésimos)', (unidade) => {
    expect(ajustarQuantidadeRapida(milesimos(1000), unidade, -1)).toBe(1000);
  });

  it.each(['g', 'ml'] as const)('%s nunca reduz abaixo de 100 (100 000 milésimos)', (unidade) => {
    expect(ajustarQuantidadeRapida(milesimos(100000), unidade, -1)).toBe(100000);
  });
});
