import { and, eq } from 'drizzle-orm';

import { Clock } from '../../ports/clock';
import {
  Configuracoes,
  ConfiguracaoRepository,
  PADROES,
} from '../../ports/configuracao.repository';
import { configuracao } from '../db/schema';
import { Db } from '../db/tipos';

export class SQLiteConfiguracaoRepository implements ConfiguracaoRepository {
  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
  ) {}

  async ler<C extends keyof Configuracoes>(
    casaId: string,
    chave: C,
  ): Promise<Configuracoes[C]> {
    const linha = this.db
      .select({ valor: configuracao.valor })
      .from(configuracao)
      .where(and(eq(configuracao.casaId, casaId), eq(configuracao.chave, chave)))
      .get();
    return linha ? (linha.valor as Configuracoes[C]) : PADROES[chave];
  }

  // Chave primária composta (casa, chave): gravar de novo substitui, nunca
  // duplica linha.
  async gravar<C extends keyof Configuracoes>(
    casaId: string,
    chave: C,
    valor: Configuracoes[C],
  ): Promise<void> {
    const agora = this.clock.agora();
    this.db
      .insert(configuracao)
      .values({ casaId, chave, valor, atualizadoEm: agora })
      .onConflictDoUpdate({
        target: [configuracao.casaId, configuracao.chave],
        set: { valor, atualizadoEm: agora },
      })
      .run();
  }
}
