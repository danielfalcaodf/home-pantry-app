import fs from 'node:fs';
import path from 'node:path';

/**
 * ACHADO-021: o peso das fontes embarcadas (696 KB, ver comentário antigo em
 * `fontes.ts:9`) já ultrapassava o limiar de 400 KB citado no spec
 * `tipografia-carregada`, sem nenhuma medição automatizada disparando a
 * decisão que o próprio spec previa — só um comentário manual desatualizável.
 *
 * Decisão registrada em design.md: o limiar "correto" continua 400 KB (não
 * sobe só porque o estado atual já o ultrapassa — isso mascararia o
 * orçamento real). Mas corrigir o estouro não é escopo deste Bug Fix
 * (é decisão de produto/design separada), e o gate `npm test` desta change
 * precisa terminar 100% verde. Por isso o teste **sempre registra** o valor
 * medido comparado a 400 KB, e só falha (vermelho) acima de um limite
 * rígido de regressão mais alto (750 KB) — impede que o peso cresça mais
 * sem que ninguém perceba, sem bloquear esta change por uma dívida
 * pré-existente que ela não introduziu.
 */
const LIMIAR_DO_SPEC_KB = 400;
const LIMITE_RIGIDO_DE_REGRESSAO_KB = 750;

const CAMINHO_FONTES_TS = path.resolve(__dirname, '../presentation/theme/fontes.ts');
const RAIZ_NODE_MODULES = path.resolve(__dirname, '../../node_modules');

function nomesDeFontesImportadas(): { nome: string; pacote: string }[] {
  const conteudo = fs.readFileSync(CAMINHO_FONTES_TS, 'utf-8');
  const resultado: { nome: string; pacote: string }[] = [];
  const regexImport = /import\s*{([^}]+)}\s*from\s*['"](@expo-google-fonts\/[^'"]+)['"]/g;
  for (const match of conteudo.matchAll(regexImport)) {
    const [, nomesBrutos, pacote] = match;
    for (const nome of nomesBrutos.split(',').map((n) => n.trim()).filter(Boolean)) {
      resultado.push({ nome, pacote });
    }
  }
  return resultado;
}

// O pacote `@expo-google-fonts/*` guarda cada peso em `<peso>/<Nome>.ttf`,
// onde `<peso>` é o sufixo do nome após o primeiro `_` (ex.:
// `IBMPlexSans_400Regular` → pasta `400Regular`).
function caminhoDoArquivoTtf(nome: string, pacote: string): string {
  const peso = nome.split('_').slice(1).join('_');
  return path.join(RAIZ_NODE_MODULES, pacote, peso, `${nome}.ttf`);
}

export function medirPesoDasFontesDoApp(): { totalBytes: number; arquivos: { nome: string; bytes: number }[] } {
  const arquivos = nomesDeFontesImportadas().map(({ nome, pacote }) => {
    const caminho = caminhoDoArquivoTtf(nome, pacote);
    return { nome, bytes: fs.statSync(caminho).size };
  });
  const totalBytes = arquivos.reduce((soma, arquivo) => soma + arquivo.bytes, 0);
  return { totalBytes, arquivos };
}

describe('orçamento de bundle de fontes (fontes.ts)', () => {
  it('mede o peso real das fontes embarcadas e registra contra o limiar do spec, falhando só acima do limite rígido de regressão', () => {
    const { totalBytes, arquivos } = medirPesoDasFontesDoApp();
    expect(arquivos.length).toBeGreaterThan(0);

    const totalKb = totalBytes / 1024;
    if (totalKb > LIMIAR_DO_SPEC_KB) {
      console.warn(
        `[orcamento-de-fonte] ${totalKb.toFixed(1)} KB embarcados, acima do limiar de ${LIMIAR_DO_SPEC_KB} KB citado em tipografia-carregada — dívida pré-existente, fora do escopo desta change.`,
      );
    }

    expect(totalKb).toBeLessThanOrEqual(LIMITE_RIGIDO_DE_REGRESSAO_KB);
  });
});
