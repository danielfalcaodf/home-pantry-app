import { and, eq, isNull, like, sql } from 'drizzle-orm';

import { normalizarCategoria } from '../../domain/produto/categoria';
import { Produto } from '../../domain/produto/produto';
import { ProdutoValidado } from '../../domain/produto/validacao';
import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { Unidade } from '../../domain/shared/unidade';
import { Clock } from '../../ports/clock';
import {
  ComandoBaixa,
  ErroEscritaProduto,
  FaltanteBruto,
  ItemListaBase,
  ProdutoRepository,
  ResultadoBaixa,
} from '../../ports/produto.repository';
import { gerarId } from '../../shared/id';
import { falha, Result, sucesso } from '../../shared/result';
import { produto as tabelaProduto, movimentoEstoque } from '../db/schema';
import { Db } from '../db/tipos';

type LinhaProduto = typeof tabelaProduto.$inferSelect;

function paraDominio(linha: LinhaProduto): Produto {
  return {
    id: linha.id,
    casaId: linha.casaId,
    nome: linha.nome,
    categoria: linha.categoria,
    unidade: linha.unidade as Unidade,
    quantidadeAtual: milesimos(linha.quantidadeAtual),
    quantidadeNecessaria: milesimos(linha.quantidadeNecessaria),
    valorUnitario: centavos(linha.valorUnitario),
    marcaPreferida: linha.marcaPreferida,
    observacao: linha.observacao,
    ativo: linha.ativo,
    criadoEm: linha.criadoEm,
    atualizadoEm: linha.atualizadoEm,
    deletadoEm: linha.deletadoEm,
    syncStatus: linha.syncStatus,
  };
}

// Não usa instanceof: o SqliteError pode vir de outro realm sob o Jest.
function ehViolacaoDeUnicidade(erro: unknown): boolean {
  const mensagem = (erro as { message?: unknown } | null)?.message;
  return typeof mensagem === 'string' && /UNIQUE/i.test(mensagem);
}

const naoRemovido = isNull(tabelaProduto.deletadoEm);

export class SQLiteProdutoRepository implements ProdutoRepository {
  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
  ) {}

  async criar(
    casaId: string,
    usuarioId: string,
    dados: ProdutoValidado,
  ): Promise<Result<Produto, ErroEscritaProduto>> {
    const agora = this.clock.agora();
    const id = gerarId(() => agora);
    try {
      this.db.transaction((tx) => {
        tx.insert(tabelaProduto)
          .values({
            id,
            casaId,
            nome: dados.nome,
            categoria: dados.categoria,
            unidade: dados.unidade,
            quantidadeAtual: dados.quantidadeAtual,
            quantidadeNecessaria: dados.quantidadeNecessaria,
            valorUnitario: dados.valorUnitario,
            criadoEm: agora,
            atualizadoEm: agora,
          })
          .run();
        // Estoque inicial vira movimento: mantém a reconciliação em zero linhas.
        if (dados.quantidadeAtual > 0) {
          tx.insert(movimentoEstoque)
            .values({
              id: gerarId(() => agora),
              casaId,
              produtoId: id,
              usuarioId,
              tipo: 'ajuste',
              quantidadeDelta: dados.quantidadeAtual,
              quantidadeResultante: dados.quantidadeAtual,
              motivo: 'estoque_inicial',
              criadoEm: agora,
            })
            .run();
        }
      });
    } catch (erro) {
      if (ehViolacaoDeUnicidade(erro)) {
        return falha('nome_duplicado');
      }
      throw erro;
    }
    const criado = await this.obterPorId(id);
    return sucesso(criado as Produto);
  }

  async editar(
    id: string,
    dados: Partial<Omit<ProdutoValidado, 'quantidadeAtual'>>,
  ): Promise<Result<Produto, ErroEscritaProduto>> {
    const existente = this.db
      .select({ id: tabelaProduto.id })
      .from(tabelaProduto)
      .where(and(eq(tabelaProduto.id, id), naoRemovido))
      .get();
    if (!existente) {
      return falha('nao_encontrado');
    }
    try {
      this.db
        .update(tabelaProduto)
        .set({
          ...(dados.nome !== undefined && { nome: dados.nome }),
          ...(dados.categoria !== undefined && { categoria: dados.categoria }),
          ...(dados.unidade !== undefined && { unidade: dados.unidade }),
          ...(dados.quantidadeNecessaria !== undefined && {
            quantidadeNecessaria: dados.quantidadeNecessaria,
          }),
          ...(dados.valorUnitario !== undefined && { valorUnitario: dados.valorUnitario }),
          atualizadoEm: this.clock.agora(),
          syncStatus: 'pendente' as const,
        })
        .where(and(eq(tabelaProduto.id, id), naoRemovido))
        .run();
    } catch (erro) {
      if (ehViolacaoDeUnicidade(erro)) {
        return falha('nome_duplicado');
      }
      throw erro;
    }
    const editado = await this.obterPorId(id);
    return sucesso(editado as Produto);
  }

  async removerLogicamente(id: string): Promise<void> {
    const agora = this.clock.agora();
    this.db
      .update(tabelaProduto)
      .set({ deletadoEm: agora, atualizadoEm: agora, syncStatus: 'pendente' })
      .where(and(eq(tabelaProduto.id, id), naoRemovido))
      .run();
  }

  async listarDespensa(casaId: string): Promise<Produto[]> {
    const linhas = this.db
      .select()
      .from(tabelaProduto)
      .where(
        and(eq(tabelaProduto.casaId, casaId), eq(tabelaProduto.ativo, true), naoRemovido),
      )
      .orderBy(
        sql`CASE
          WHEN ${tabelaProduto.quantidadeAtual} = 0 THEN 0
          WHEN ${tabelaProduto.quantidadeAtual} < ${tabelaProduto.quantidadeNecessaria} THEN 1
          ELSE 2
        END`,
        sql`${tabelaProduto.nome} COLLATE NOCASE`,
      )
      .all();
    return linhas.map(paraDominio);
  }

  // Repete literalmente o predicado do índice parcial (DATABASE §6.2).
  // Valores brutos: o arredondamento é regra de domínio, não de SQL.
  async listarFaltantes(casaId: string): Promise<FaltanteBruto[]> {
    const linhas = this.db
      .select({
        id: tabelaProduto.id,
        nome: tabelaProduto.nome,
        categoria: tabelaProduto.categoria,
        unidade: tabelaProduto.unidade,
        valorUnitario: tabelaProduto.valorUnitario,
        quantidadeAtual: tabelaProduto.quantidadeAtual,
        quantidadeNecessaria: tabelaProduto.quantidadeNecessaria,
        faltaBruta: sql<number>`${tabelaProduto.quantidadeNecessaria} - ${tabelaProduto.quantidadeAtual}`,
      })
      .from(tabelaProduto)
      .where(
        and(
          eq(tabelaProduto.casaId, casaId),
          eq(tabelaProduto.ativo, true),
          naoRemovido,
          sql`${tabelaProduto.quantidadeAtual} < ${tabelaProduto.quantidadeNecessaria}`,
        ),
      )
      .orderBy(
        sql`${tabelaProduto.categoria} COLLATE NOCASE`,
        sql`${tabelaProduto.nome} COLLATE NOCASE`,
      )
      .all();
    return linhas.map((linha) => ({
      ...linha,
      unidade: linha.unidade as Unidade,
      valorUnitario: centavos(linha.valorUnitario),
      quantidadeAtual: milesimos(linha.quantidadeAtual),
      quantidadeNecessaria: milesimos(linha.quantidadeNecessaria),
      faltaBruta: milesimos(linha.faltaBruta),
    }));
  }

  async buscarPorNome(casaId: string, termo: string): Promise<Produto[]> {
    const linhas = this.db
      .select()
      .from(tabelaProduto)
      .where(
        and(
          eq(tabelaProduto.casaId, casaId),
          eq(tabelaProduto.ativo, true),
          naoRemovido,
          like(tabelaProduto.nome, `%${termo}%`),
        ),
      )
      .orderBy(sql`${tabelaProduto.nome} COLLATE NOCASE`)
      .all();
    return linhas.map(paraDominio);
  }

  async listarCategorias(casaId: string): Promise<string[]> {
    const linhas = this.db
      .selectDistinct({ categoria: tabelaProduto.categoria })
      .from(tabelaProduto)
      .where(
        and(
          eq(tabelaProduto.casaId, casaId),
          naoRemovido,
          sql`${tabelaProduto.categoria} IS NOT NULL`,
        ),
      )
      .orderBy(sql`${tabelaProduto.categoria} COLLATE NOCASE`)
      .all();
    return linhas.map((linha) => linha.categoria as string);
  }

  async obterPorId(id: string): Promise<Produto | null> {
    const linha = this.db
      .select()
      .from(tabelaProduto)
      .where(eq(tabelaProduto.id, id))
      .get();
    return linha ? paraDominio(linha) : null;
  }

  // Sem os filtros de ativo/não-removido de listarDespensa: o backup precisa
  // do estado completo, inclusive o que a UI normal nunca mostra.
  async listarTudoParaBackup(casaId: string): Promise<Produto[]> {
    const linhas = this.db
      .select()
      .from(tabelaProduto)
      .where(eq(tabelaProduto.casaId, casaId))
      .all();
    return linhas.map(paraDominio);
  }

  // Caminho crítico (DATABASE §6.3): UPDATE com proteção de não-negativo e
  // INSERT do movimento lendo o saldo do banco DEPOIS do update — tudo na
  // mesma transação. Nunca separar as duas escritas.
  async darBaixa(comando: ComandoBaixa): Promise<Result<ResultadoBaixa, 'nao_encontrado'>> {
    const { produtoId, quantidade, usuarioId, criadoEm } = comando;
    return this.db.transaction((tx): Result<ResultadoBaixa, 'nao_encontrado'> => {
      const atual = tx
        .select({
          casaId: tabelaProduto.casaId,
          quantidadeAtual: tabelaProduto.quantidadeAtual,
        })
        .from(tabelaProduto)
        .where(and(eq(tabelaProduto.id, produtoId), naoRemovido))
        .get();
      if (!atual) {
        return falha('nao_encontrado');
      }
      if (atual.quantidadeAtual <= 0) {
        return sucesso({ gravou: false, motivo: 'estoque_zerado' });
      }

      tx.update(tabelaProduto)
        .set({
          quantidadeAtual: sql`MAX(0, ${tabelaProduto.quantidadeAtual} - ${quantidade})`,
          atualizadoEm: criadoEm,
          syncStatus: 'pendente',
        })
        .where(eq(tabelaProduto.id, produtoId))
        .run();

      const depois = tx
        .select({ quantidadeAtual: tabelaProduto.quantidadeAtual })
        .from(tabelaProduto)
        .where(eq(tabelaProduto.id, produtoId))
        .get() as { quantidadeAtual: number };

      const variacaoAplicada = depois.quantidadeAtual - atual.quantidadeAtual;
      const movimentoId = gerarId(() => criadoEm);
      tx.insert(movimentoEstoque)
        .values({
          id: movimentoId,
          casaId: atual.casaId,
          produtoId,
          usuarioId,
          tipo: 'baixa',
          quantidadeDelta: variacaoAplicada,
          quantidadeResultante: depois.quantidadeAtual,
          criadoEm,
        })
        .run();

      return sucesso({
        gravou: true,
        saldoResultante: milesimos(depois.quantidadeAtual),
        movimentoId,
      });
    });
  }

  // Mesma forma da baixa, sinal invertido e sem o caso "estoque zerado":
  // repor sobre zero é justamente o caso normal.
  async repor(comando: ComandoBaixa): Promise<Result<ResultadoBaixa, 'nao_encontrado'>> {
    const { produtoId, quantidade, usuarioId, criadoEm } = comando;
    return this.db.transaction((tx): Result<ResultadoBaixa, 'nao_encontrado'> => {
      const atual = tx
        .select({ casaId: tabelaProduto.casaId })
        .from(tabelaProduto)
        .where(and(eq(tabelaProduto.id, produtoId), naoRemovido))
        .get();
      if (!atual) {
        return falha('nao_encontrado');
      }

      tx.update(tabelaProduto)
        .set({
          quantidadeAtual: sql`${tabelaProduto.quantidadeAtual} + ${quantidade}`,
          atualizadoEm: criadoEm,
          syncStatus: 'pendente',
        })
        .where(eq(tabelaProduto.id, produtoId))
        .run();

      const depois = tx
        .select({ quantidadeAtual: tabelaProduto.quantidadeAtual })
        .from(tabelaProduto)
        .where(eq(tabelaProduto.id, produtoId))
        .get() as { quantidadeAtual: number };

      const movimentoId = gerarId(() => criadoEm);
      tx.insert(movimentoEstoque)
        .values({
          id: movimentoId,
          casaId: atual.casaId,
          produtoId,
          usuarioId,
          tipo: 'reposicao',
          quantidadeDelta: quantidade,
          quantidadeResultante: depois.quantidadeAtual,
          criadoEm,
        })
        .run();

      return sucesso({
        gravou: true,
        saldoResultante: milesimos(depois.quantidadeAtual),
        movimentoId,
      });
    });
  }

  async adotarListaBase(casaId: string, itens: ItemListaBase[]): Promise<Produto[]> {
    const agora = this.clock.agora();
    const ids: string[] = [];
    this.db.transaction((tx) => {
      for (const item of itens) {
        const id = gerarId(() => agora);
        ids.push(id);
        tx.insert(tabelaProduto)
          .values({
            id,
            casaId,
            nome: item.nome,
            categoria: normalizarCategoria(item.categoria),
            unidade: item.unidade,
            quantidadeAtual: 0,
            quantidadeNecessaria: item.quantidadeNecessaria,
            criadoEm: agora,
            atualizadoEm: agora,
          })
          .run();
      }
    });
    const criados: Produto[] = [];
    for (const id of ids) {
      const criado = await this.obterPorId(id);
      if (criado) {
        criados.push(criado);
      }
    }
    return criados;
  }
}
