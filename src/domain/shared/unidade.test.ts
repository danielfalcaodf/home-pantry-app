import { ehIndivisivel, ehUnidade, rotuloDaUnidade, UNIDADES, Unidade } from './unidade';

describe('unidade', () => {
  it('tem exatamente as sete unidades suportadas', () => {
    expect(UNIDADES).toEqual(['un', 'kg', 'g', 'L', 'ml', 'pacote', 'caixa']);
  });

  it.each<[Unidade, boolean]>([
    ['un', true],
    ['pacote', true],
    ['caixa', true],
    ['kg', false],
    ['g', false],
    ['L', false],
    ['ml', false],
  ])('classifica %s como indivisível=%s', (unidade, esperado) => {
    expect(ehIndivisivel(unidade)).toBe(esperado);
  });

  it.each<[Unidade, string, string]>([
    ['un', 'un', 'un'],
    ['kg', 'kg', 'kg'],
    ['g', 'g', 'g'],
    ['L', 'L', 'L'],
    ['ml', 'ml', 'ml'],
    ['pacote', 'pacote', 'pacotes'],
    ['caixa', 'caixa', 'caixas'],
  ])('rotula %s como %s/%s', (unidade, singular, plural) => {
    expect(rotuloDaUnidade(unidade, false)).toBe(singular);
    expect(rotuloDaUnidade(unidade, true)).toBe(plural);
  });

  it('reconhece texto que é unidade e rejeita o que não é', () => {
    expect(ehUnidade('kg')).toBe(true);
    expect(ehUnidade('tonelada')).toBe(false);
  });
});
