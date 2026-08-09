import { Milesimos } from '../../domain/shared/quantidade';
import { Unidade } from '../../domain/shared/unidade';
import { Clock } from '../../ports/clock';
import { ItemListaBase } from '../../ports/produto.repository';
import { gerarId } from '../../shared/id';
import { casa, usuario } from './schema';
import { Db } from './tipos';
import listaBase from './lista-base.json';

export type IdentidadeLocal = { casaId: string; usuarioId: string };

// Primeira abertura: cria a casa padrão ("Minha casa", nome editável) e o
// usuário local como admin. Idempotente — aberturas seguintes reutilizam.
// A lista base NÃO é inserida aqui: ela é oferecida pelo estado vazio da
// despensa (design D6), nunca aplicada automaticamente.
export function garantirCasaEUsuario(db: Db, clock: Clock): IdentidadeLocal {
  const existente = db.select({ id: casa.id }).from(casa).limit(1).get();
  if (existente) {
    const usuarioExistente = db
      .select({ id: usuario.id })
      .from(usuario)
      .limit(1)
      .get() as { id: string };
    return { casaId: existente.id, usuarioId: usuarioExistente.id };
  }

  const agora = clock.agora();
  const casaId = gerarId(() => agora);
  const usuarioId = gerarId(() => agora);
  db.transaction((tx) => {
    tx.insert(casa)
      .values({ id: casaId, nome: 'Minha casa', criadaEm: agora, atualizadoEm: agora })
      .run();
    tx.insert(usuario)
      .values({
        id: usuarioId,
        casaId,
        nome: 'Eu',
        perfil: 'admin',
        criadoEm: agora,
        atualizadoEm: agora,
      })
      .run();
  });
  return { casaId, usuarioId };
}

export function itensDaListaBase(): ItemListaBase[] {
  return listaBase.itens.map((item) => ({
    nome: item.nome,
    categoria: item.categoria,
    unidade: item.unidade as Unidade,
    quantidadeNecessaria: item.quantidadeNecessaria as Milesimos,
  }));
}
