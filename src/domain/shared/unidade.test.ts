import { ehIndivisivel, ehUnidade, rotuloDaUnidade, UNIDADES, Unidade } from './unidade';

describe('unidade', () => {
  it('tem exatamente as duas unidades suportadas', () => {
    expect(UNIDADES).toEqual(['un', 'kg']);
  });

  it.each<[Unidade, boolean]>([
    ['un', true],
    ['kg', false],
  ])('classifica %s como indivisível=%s', (unidade, esperado) => {
    expect(ehIndivisivel(unidade)).toBe(esperado);
  });

  it.each<[Unidade, string, string]>([
    ['un', 'un', 'un'],
    ['kg', 'kg', 'kg'],
  ])('rotula %s como %s/%s', (unidade, singular, plural) => {
    expect(rotuloDaUnidade(unidade, false)).toBe(singular);
    expect(rotuloDaUnidade(unidade, true)).toBe(plural);
  });

  it('reconhece texto que é unidade e rejeita o que não é', () => {
    expect(ehUnidade('kg')).toBe(true);
    expect(ehUnidade('tonelada')).toBe(false);
  });

  it.each(['g', 'ml', 'L', 'pacote', 'caixa'])('unidade removida %s não é mais unidade', (valor) => {
    expect(ehUnidade(valor)).toBe(false);
  });
});
