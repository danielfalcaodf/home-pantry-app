import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * ACHADO-020: a escala de espaçamento (4, 8, 12, 16, 24, 32, 48) não tinha
 * nenhum enforcement, ao contrário da regra de hex que já existe. Decisão
 * registrada em design.md: teste de conformidade por varredura de
 * `src/presentation/components/`, não regra de lint customizada — a lista
 * de propriedades-alvo é só `padding*`/`margin*`/`gap` (não `border*`,
 * que tem escala própria).
 */
const ESCALA_DE_ESPACAMENTO = [4, 8, 12, 16, 24, 32, 48];

const PROPRIEDADE_DE_ESPACAMENTO = /\b((?:padding|margin)(?:Horizontal|Vertical|Top|Bottom|Left|Right)?|gap)\s*:\s*(-?\d+(?:\.\d+)?)/g;

const DIR_COMPONENTES = path.resolve(__dirname, '../presentation/components');

function arquivosTsxDoDiretorio(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((nome) => nome.endsWith('.tsx') && !nome.endsWith('.test.tsx') && !nome.endsWith('.test-types.tsx'))
    .map((nome) => path.join(dir, nome));
}

function violacoesDoArquivo(caminho: string): { propriedade: string; valor: number }[] {
  const conteudo = fs.readFileSync(caminho, 'utf-8');
  const violacoes: { propriedade: string; valor: number }[] = [];
  for (const match of conteudo.matchAll(PROPRIEDADE_DE_ESPACAMENTO)) {
    const [, propriedade, valorBruto] = match;
    const valor = Number(valorBruto);
    if (!ESCALA_DE_ESPACAMENTO.includes(valor)) {
      violacoes.push({ propriedade, valor });
    }
  }
  return violacoes;
}

describe('escala de espaçamento em src/presentation/components/', () => {
  it('nenhum literal de padding/margin/gap foge da escala [4, 8, 12, 16, 24, 32, 48]', () => {
    const arquivos = arquivosTsxDoDiretorio(DIR_COMPONENTES);
    expect(arquivos.length).toBeGreaterThan(0);

    const violacoesPorArquivo = arquivos
      .map((arquivo) => ({ arquivo: path.basename(arquivo), violacoes: violacoesDoArquivo(arquivo) }))
      .filter((registro) => registro.violacoes.length > 0);

    expect(violacoesPorArquivo).toEqual([]);
  });

  // Controle negativo (task 4.4): propriedades que não são espaçamento não
  // devem ser sinalizadas, mesmo com valor fora da escala.
  it('propriedades fora do escopo (flex, fontSize, opacity, borderWidth) não são sinalizadas', () => {
    const fixture = `
      const estilo = {
        flex: 1,
        fontSize: 16,
        opacity: 0.5,
        borderWidth: 1,
        borderRadius: 999,
        padding: 16,
      };
    `;
    const tmp = path.join(os.tmpdir(), '__fixture-controle-negativo__.tsx.tmp');
    fs.writeFileSync(tmp, fixture);
    try {
      const violacoes = violacoesDoArquivo(tmp);
      expect(violacoes).toEqual([]);
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  it('detecta um literal fora da escala como violação (caso de controle positivo)', () => {
    const fixture = `const estilo = { padding: 10, gap: 4 };`;
    const tmp = path.join(os.tmpdir(), '__fixture-controle-positivo__.tsx.tmp');
    fs.writeFileSync(tmp, fixture);
    try {
      const violacoes = violacoesDoArquivo(tmp);
      expect(violacoes).toEqual([{ propriedade: 'padding', valor: 10 }]);
    } finally {
      fs.unlinkSync(tmp);
    }
  });
});
