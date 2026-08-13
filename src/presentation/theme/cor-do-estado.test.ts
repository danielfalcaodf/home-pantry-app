import { corDoEstado, corDoMovimento } from './cor-do-estado';
import { despensa, porcelana } from './tokens';

describe('corDoEstado', () => {
  it('"ok" usa a cor de "cheio" do tema (nomes diferentes, mesma origem visual)', () => {
    expect(corDoEstado(despensa, 'ok')).toBe(despensa.state.cheio);
  });

  it('"emFalta" e "critico" usam a cor de estado homônima', () => {
    expect(corDoEstado(despensa, 'emFalta')).toBe(despensa.state.emFalta);
    expect(corDoEstado(despensa, 'critico')).toBe(despensa.state.critico);
  });
});

describe('corDoMovimento (ACHADO-043)', () => {
  it.each([despensa, porcelana])(
    'baixa, reposição e ajuste têm três cores mutuamente distintas ($nome)',
    (tema) => {
      const baixa = corDoMovimento(tema, 'baixa');
      const reposicao = corDoMovimento(tema, 'reposicao');
      const ajuste = corDoMovimento(tema, 'ajuste');

      expect(new Set([baixa, reposicao, ajuste]).size).toBe(3);
    },
  );

  it('reposição usa a cor de "cheio" e ajuste usa a cor de ação (azulejo)', () => {
    expect(corDoMovimento(despensa, 'reposicao')).toBe(despensa.state.cheio);
    expect(corDoMovimento(despensa, 'ajuste')).toBe(despensa.action.azulejo);
    expect(corDoMovimento(despensa, 'baixa')).toBe(despensa.text.primary);
  });
});
