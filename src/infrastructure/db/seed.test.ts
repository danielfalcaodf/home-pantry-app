import { SQLiteProdutoRepository } from '../repositories/sqlite-produto.repository';
import { garantirCasaEUsuario, itensDaListaBase } from './seed';
import { criarDbDeTeste } from './teste/criar-db-teste';

const clock = { agora: () => 1_700_000_000_000 };

describe('garantirCasaEUsuario', () => {
  it('cria casa e usuário na primeira abertura e não duplica nas seguintes', () => {
    const { db, sqlite } = criarDbDeTeste();
    const primeira = garantirCasaEUsuario(db, clock);
    const segunda = garantirCasaEUsuario(db, clock);
    expect(segunda).toEqual(primeira);
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM casa').get()).toEqual({ n: 1 });
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM usuario').get()).toEqual({ n: 1 });
    const perfil = sqlite.prepare('SELECT perfil FROM usuario').get() as { perfil: string };
    expect(perfil.perfil).toBe('admin');
  });
});

describe('lista base', () => {
  it('tem cerca de 40 itens com nome, categoria, unidade e quantidade sugerida', () => {
    const itens = itensDaListaBase();
    expect(itens.length).toBeGreaterThanOrEqual(35);
    for (const item of itens) {
      expect(item.nome.length).toBeGreaterThan(0);
      expect(item.categoria.length).toBeGreaterThan(0);
      expect(item.quantidadeNecessaria).toBeGreaterThan(0);
    }
  });

  it('não é inserida automaticamente na primeira abertura', () => {
    const { db, sqlite } = criarDbDeTeste();
    garantirCasaEUsuario(db, clock);
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM produto').get()).toEqual({ n: 0 });
  });

  it('adoção parcial insere só o subconjunto escolhido, com categoria normalizada', async () => {
    const { db, sqlite } = criarDbDeTeste();
    const { casaId } = garantirCasaEUsuario(db, clock);
    const repo = new SQLiteProdutoRepository(db, clock);
    const escolhidos = itensDaListaBase().slice(0, 5);
    const criados = await repo.adotarListaBase(casaId, escolhidos);
    expect(criados).toHaveLength(5);
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM produto').get()).toEqual({ n: 5 });
    expect(criados.every((p) => p.quantidadeAtual === 0)).toBe(true);
    expect(criados[0].categoria).toBe('Grãos e massas');
  });
});
