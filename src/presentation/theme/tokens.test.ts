import { razaoDeContraste, sobrepor } from './contraste';
import { despensa, porcelana, Theme } from './tokens';

const AA_TEXTO_NORMAL = 4.5;
const AA_TEXTO_GRANDE = 3;

function chavesProfundas(objeto: object, prefixo = ''): string[] {
  return Object.entries(objeto).flatMap(([chave, valor]) => {
    const caminho = prefixo ? `${prefixo}.${chave}` : chave;
    return typeof valor === 'object' && valor !== null
      ? chavesProfundas(valor as object, caminho)
      : [caminho];
  });
}

describe('paridade entre os dois temas', () => {
  it('expõem exatamente o mesmo conjunto de chaves', () => {
    const chavesEscuro = chavesProfundas(despensa).sort();
    const chavesClaro = chavesProfundas(porcelana).sort();
    expect(chavesClaro).toEqual(chavesEscuro);
  });

  it('opacidade de preenchimento é 0,12 no escuro e 0,10 no claro', () => {
    expect(despensa.fillOpacity).toBe(0.12);
    expect(porcelana.fillOpacity).toBe(0.1);
  });
});

describe.each<[string, Theme]>([
  ['despensa', despensa],
  ['porcelana', porcelana],
])('contraste do tema %s', (_nome, tema) => {
  it.each([
    ['text.primary', 'text', 'primary'],
    ['text.secondary', 'text', 'secondary'],
  ])('%s sobre bg.base passa AA', (_rotulo, grupo, chave) => {
    const cor = (tema as unknown as Record<string, Record<string, string>>)[grupo][chave];
    expect(razaoDeContraste(cor, tema.bg.base)).toBeGreaterThanOrEqual(AA_TEXTO_NORMAL);
  });

  it.each([
    ['text.primary sobre surface', () => razaoDeContraste(tema.text.primary, tema.bg.surface)],
    ['text.primary sobre raised', () => razaoDeContraste(tema.text.primary, tema.bg.raised)],
    [
      'text.secondary sobre surface',
      () => razaoDeContraste(tema.text.secondary, tema.bg.surface),
    ],
  ])('%s passa AA', (_rotulo, calcular) => {
    expect(calcular()).toBeGreaterThanOrEqual(AA_TEXTO_NORMAL);
  });

  it.each(['cheio', 'emFalta', 'critico'] as const)(
    'cor de estado %s sobre bg.base passa AA de texto grande',
    (estado) => {
      expect(razaoDeContraste(tema.state[estado], tema.bg.base)).toBeGreaterThanOrEqual(
        AA_TEXTO_GRANDE,
      );
    },
  );

  it('action.azulejo sobre bg.base passa AA de texto grande', () => {
    expect(razaoDeContraste(tema.action.azulejo, tema.bg.base)).toBeGreaterThanOrEqual(
      AA_TEXTO_GRANDE,
    );
  });

  it('text.onAction sobre action.azulejo passa AA', () => {
    expect(razaoDeContraste(tema.text.onAction, tema.action.azulejo)).toBeGreaterThanOrEqual(
      AA_TEXTO_NORMAL,
    );
  });

  // O texto do item fica SOBRE a tinta do nível, não sobre o fundo limpo —
  // é esse par que precisa passar, e é o que costuma ser esquecido.
  describe('texto sobre a tinta do medidor', () => {
    it.each(['cheio', 'emFalta', 'critico'] as const)(
      'text.primary sobre tinta de %s passa AA',
      (estado) => {
        const tinta = sobrepor(tema.state[estado], tema.bg.base, tema.fillOpacity);
        expect(razaoDeContraste(tema.text.primary, tinta)).toBeGreaterThanOrEqual(
          AA_TEXTO_NORMAL,
        );
      },
    );

    it.each(['cheio', 'emFalta', 'critico'] as const)(
      'text.secondary sobre tinta de %s passa AA',
      (estado) => {
        const tinta = sobrepor(tema.state[estado], tema.bg.base, tema.fillOpacity);
        expect(razaoDeContraste(tema.text.secondary, tinta)).toBeGreaterThanOrEqual(
          AA_TEXTO_NORMAL,
        );
      },
    );
  });
});
