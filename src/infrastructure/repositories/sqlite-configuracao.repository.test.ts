import { criarDbDeTeste, semearCasaEUsuario } from '../db/teste/criar-db-teste';
import { SQLiteConfiguracaoRepository } from './sqlite-configuracao.repository';

const clock = { agora: () => 1_700_000_000_000 };

function montar() {
  const { db, sqlite } = criarDbDeTeste();
  const { casaId } = semearCasaEUsuario(sqlite);
  return { repo: new SQLiteConfiguracaoRepository(db, clock), sqlite, casaId };
}

describe('configuração chave-valor', () => {
  it('preferência ausente retorna o padrão sem erro', async () => {
    const { repo, casaId } = montar();
    await expect(repo.ler(casaId, 'tema')).resolves.toBe('automatico');
  });

  it('grava e lê a preferência', async () => {
    const { repo, casaId } = montar();
    await repo.gravar(casaId, 'tema', 'escuro');
    await expect(repo.ler(casaId, 'tema')).resolves.toBe('escuro');
  });

  it('gravação repetida substitui sem duplicar linha', async () => {
    const { repo, casaId, sqlite } = montar();
    await repo.gravar(casaId, 'tema', 'escuro');
    await repo.gravar(casaId, 'tema', 'claro');
    await repo.gravar(casaId, 'tema', 'automatico');
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM configuracao').get()).toEqual({ n: 1 });
    await expect(repo.ler(casaId, 'tema')).resolves.toBe('automatico');
  });
});
