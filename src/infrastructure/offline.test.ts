import * as fs from 'node:fs';
import * as path from 'node:path';

// Task 7.5 (change modo-compra-e-fechamento): o fechamento funciona sem
// conexão porque não existe caminho de rede no app inteiro — SQLite local é
// a única fonte de dado (ARQUITETURA §1, "MVP roda 100% local, sem
// backend"). Sem hardware físico neste ambiente para desligar o Wi-Fi e
// medir, a verificação possível é estática: nenhum arquivo de código chama
// uma API de rede, então nada no fechamento (nem no resto do app) pode
// depender de conectividade.
const PADRAO_REDE = /\bfetch\(|axios|XMLHttpRequest|NetInfo/;

function listarArquivosDeCodigo(diretorio: string): string[] {
  const resultado: string[] = [];
  for (const nome of fs.readdirSync(diretorio, { withFileTypes: true })) {
    const caminho = path.join(diretorio, nome.name);
    if (nome.isDirectory()) {
      resultado.push(...listarArquivosDeCodigo(caminho));
    } else if (/\.(ts|tsx)$/.test(nome.name) && !nome.name.endsWith('.test.ts') && !nome.name.endsWith('.test.tsx')) {
      resultado.push(caminho);
    }
  }
  return resultado;
}

describe('fechamento funciona sem conexão (task 7.5)', () => {
  it('nenhum arquivo de código-fonte usa uma API de rede', () => {
    const raiz = path.join(__dirname, '..', '..');
    const arquivos = [
      ...listarArquivosDeCodigo(path.join(raiz, 'src')),
      ...listarArquivosDeCodigo(path.join(raiz, 'app')),
    ];
    const comRede = arquivos.filter((arquivo) => PADRAO_REDE.test(fs.readFileSync(arquivo, 'utf8')));
    expect(comRede).toEqual([]);
  });
});
