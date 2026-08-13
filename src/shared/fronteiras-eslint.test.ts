import path from 'node:path';
import { ESLint } from 'eslint';

/**
 * ACHADO-008: as regras de fronteira do `eslint.config.js` (ARQUITETURA §2)
 * estavam configuradas mas nunca tinham um teste que forçasse a violação e
 * confirmasse a rejeição — só "não quebrou até agora". Este teste roda o
 * ESLint programaticamente sobre fixtures inline, uma por regra.
 *
 * `overrideConfigFile: true` (em vez de apontar o caminho do arquivo) evita
 * o carregador de config do ESLint fazer `import()` dinâmico do
 * `eslint.config.js` — isso quebra sob o module registry do Jest
 * ("dynamic import callback was invoked without --experimental-vm-modules").
 * `require()` direto do config (CommonJS) não tem esse problema.
 */
describe('regras de fronteira do ESLint (eslint.config.js)', () => {
  let eslint: ESLint;

  beforeAll(() => {
    const raiz = path.resolve(__dirname, '../..');
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- eslint.config.js é CommonJS; import() dinâmico quebra sob o module registry do Jest.
    const config = require(path.join(raiz, 'eslint.config.js'));
    eslint = new ESLint({
      cwd: raiz,
      overrideConfigFile: true,
      overrideConfig: config,
    });
  });

  async function lintar(filePath: string, codigo: string) {
    const [resultado] = await eslint.lintText(codigo, { filePath });
    return resultado.messages;
  }

  it('domain/ importando react produz erro de fronteira', async () => {
    const mensagens = await lintar(
      'src/domain/violacao-react.ts',
      "import { useState } from 'react';\nexport const x = useState;\n",
    );
    expect(mensagens.some((m) => m.ruleId === 'no-restricted-imports')).toBe(true);
  });

  it('application/ importando de infrastructure/ produz erro de fronteira', async () => {
    const mensagens = await lintar(
      'src/application/violacao-infra.ts',
      "import { db } from '../infrastructure/db/client';\nexport const y = db;\n",
    );
    expect(mensagens.some((m) => m.ruleId === 'boundaries/dependencies')).toBe(true);
  });

  it('presentation/ importando infrastructure/ (cliente de banco) produz erro de fronteira', async () => {
    const mensagens = await lintar(
      'src/presentation/components/violacao-db.tsx',
      "import { db } from '../../infrastructure/db/client';\nexport const z = db;\n",
    );
    expect(mensagens.some((m) => m.ruleId === 'boundaries/dependencies')).toBe(true);
  });

  it('hex literal em componente de presentation/components/ produz erro de lint', async () => {
    const mensagens = await lintar(
      'src/presentation/components/violacao-hex.tsx',
      "export const estilo = { backgroundColor: '#FF0000' };\n",
    );
    expect(mensagens.some((m) => m.ruleId === 'no-restricted-syntax')).toBe(true);
  });

  // Controle negativo (task 2.5): uma fixture conforme não deve produzir
  // nenhum erro das quatro regras acima — prova que o teste não está
  // sempre-verde por engano (falso positivo constante).
  it('fixture conforme (sem violação) não produz erro de nenhuma das regras testadas', async () => {
    const mensagens = await lintar(
      'src/domain/produto/conforme.ts',
      'export function somar(a: number, b: number): number {\n  return a + b;\n}\n',
    );
    const idsRelevantes = ['boundaries/dependencies', 'no-restricted-syntax', 'no-restricted-imports'];
    expect(mensagens.filter((m) => idsRelevantes.includes(m.ruleId ?? ''))).toHaveLength(0);
  });
});
