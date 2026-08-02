import { familias, TAMANHO_MAXIMO, tipografia } from './tipografia';

describe('escala tipográfica', () => {
  it('nenhum tamanho excede 34pt', () => {
    for (const [papel, estilo] of Object.entries(tipografia)) {
      expect({ papel, tamanho: estilo.fontSize }).toEqual({
        papel,
        tamanho: expect.any(Number),
      });
      expect(estilo.fontSize).toBeLessThanOrEqual(TAMANHO_MAXIMO);
    }
  });

  it('altura de linha nunca é menor que o tamanho', () => {
    for (const estilo of Object.values(tipografia)) {
      expect(estilo.lineHeight).toBeGreaterThanOrEqual(estilo.fontSize);
    }
  });

  it('todo papel de dado é monoespaçado e tabular', () => {
    for (const papel of ['data.lg', 'data.md'] as const) {
      expect(tipografia[papel].tabular).toBe(true);
      expect(tipografia[papel].fontFamily).toMatch(/Mono/);
    }
  });

  it('nenhum papel de texto usa a família monoespaçada', () => {
    for (const papel of ['display.lg', 'display.sm', 'body.lg', 'body.md', 'label', 'caption'] as const) {
      expect(tipografia[papel].fontFamily).not.toMatch(/Mono/);
      expect(tipografia[papel].tabular).toBe(false);
    }
  });

  it('referencia apenas os pesos que os pacotes exportam', () => {
    const disponiveis = new Set(Object.values(familias));
    for (const estilo of Object.values(tipografia)) {
      expect(disponiveis.has(estilo.fontFamily as never)).toBe(true);
    }
  });
});
