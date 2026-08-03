import { eq } from 'drizzle-orm';

import {
  ArquivoBackup,
  CasaBackup,
  PerfilUsuario,
  UsuarioBackup,
  VERSAO_SCHEMA_BACKUP_ATUAL,
} from '../../domain/backup/backup.schema';
import { BackupRepository } from '../../ports/backup.repository';
import { CompraRepository } from '../../ports/compra.repository';
import { MovimentoRepository } from '../../ports/movimento.repository';
import { ProdutoRepository } from '../../ports/produto.repository';
import {
  casa as tabelaCasa,
  compra as tabelaCompra,
  compraItem as tabelaCompraItem,
  movimentoEstoque,
  produto as tabelaProduto,
  usuario as tabelaUsuario,
} from '../db/schema';
import { Db } from '../db/tipos';

export class SQLiteBackupRepository implements BackupRepository {
  constructor(
    private readonly db: Db,
    private readonly produtoRepository: ProdutoRepository,
    private readonly movimentoRepository: MovimentoRepository,
    private readonly compraRepository: CompraRepository,
  ) {}

  // Casa/usuário não têm repositório próprio (só existem como tabela —
  // ver domain/backup/backup.schema.ts) — lidos direto do schema aqui
  // dentro, mesma licença que seed.ts já usa (infrastructure é a única
  // camada que conhece o cliente SQLite).
  async montar(casaId: string, exportadoEm: number): Promise<ArquivoBackup> {
    const casaLinha = this.db.select().from(tabelaCasa).where(eq(tabelaCasa.id, casaId)).get();
    if (!casaLinha) {
      throw new Error(`casa ${casaId} não encontrada`);
    }
    const usuariosLinhas = this.db
      .select()
      .from(tabelaUsuario)
      .where(eq(tabelaUsuario.casaId, casaId))
      .all();

    const [produtos, movimentos, comprasComItens] = await Promise.all([
      this.produtoRepository.listarTudoParaBackup(casaId),
      this.movimentoRepository.listarTudoParaBackup(casaId),
      this.compraRepository.listarTudoParaBackup(casaId),
    ]);

    const casa: CasaBackup = {
      id: casaLinha.id,
      nome: casaLinha.nome,
      criadaEm: casaLinha.criadaEm,
      atualizadoEm: casaLinha.atualizadoEm,
    };
    const usuarios: UsuarioBackup[] = usuariosLinhas.map((linha) => ({
      id: linha.id,
      casaId: linha.casaId,
      nome: linha.nome,
      perfil: linha.perfil as PerfilUsuario,
      criadoEm: linha.criadoEm,
      atualizadoEm: linha.atualizadoEm,
    }));

    return {
      versaoSchema: VERSAO_SCHEMA_BACKUP_ATUAL,
      exportadoEm,
      casa,
      usuarios,
      produtos,
      movimentos,
      compras: comprasComItens.map((c) => c.compra),
      itensCompra: comprasComItens.flatMap((c) => c.itens),
    };
  }

  // UMA transação para o arquivo inteiro (spec "Restauração transacional"):
  // falha em qualquer INSERT/UPDATE (violação de restrição, FK ausente)
  // lança e desfaz tudo — nenhum estado parcial. Ordem respeita as FKs:
  // usuário depende de casa, produto de casa, compra de casa e usuário,
  // item de compra de compra e produto, movimento de casa/produto/
  // usuário/compra.
  async restaurar(arquivo: ArquivoBackup, casaIdLocal: string, aplicadoEm: number): Promise<void> {
    this.db.transaction((tx) => {
      tx.update(tabelaCasa)
        .set({ nome: arquivo.casa.nome, atualizadoEm: aplicadoEm })
        .where(eq(tabelaCasa.id, casaIdLocal))
        .run();

      for (const usuario of arquivo.usuarios) {
        const linha = { ...usuario, casaId: casaIdLocal };
        tx.insert(tabelaUsuario)
          .values(linha)
          .onConflictDoUpdate({
            target: tabelaUsuario.id,
            set: {
              casaId: linha.casaId,
              nome: linha.nome,
              perfil: linha.perfil,
              criadoEm: linha.criadoEm,
              atualizadoEm: linha.atualizadoEm,
            },
          })
          .run();
      }

      for (const produto of arquivo.produtos) {
        const linha = { ...produto, casaId: casaIdLocal };
        tx.insert(tabelaProduto)
          .values(linha)
          .onConflictDoUpdate({
            target: tabelaProduto.id,
            set: {
              casaId: linha.casaId,
              nome: linha.nome,
              categoria: linha.categoria,
              unidade: linha.unidade,
              quantidadeAtual: linha.quantidadeAtual,
              quantidadeNecessaria: linha.quantidadeNecessaria,
              valorUnitario: linha.valorUnitario,
              marcaPreferida: linha.marcaPreferida,
              observacao: linha.observacao,
              ativo: linha.ativo,
              criadoEm: linha.criadoEm,
              atualizadoEm: linha.atualizadoEm,
              deletadoEm: linha.deletadoEm,
              syncStatus: linha.syncStatus,
            },
          })
          .run();
      }

      // Se o backup e o aparelho local tiverem, cada um, uma compra
      // 'aberta' com id diferente, `ux_compra_aberta` rejeita a segunda —
      // a transação inteira falha e nada é escrito (design D8: aceito e
      // testado, resolve-se finalizando ou cancelando uma das duas).
      for (const compra of arquivo.compras) {
        const linha = { ...compra, casaId: casaIdLocal };
        tx.insert(tabelaCompra)
          .values(linha)
          .onConflictDoUpdate({
            target: tabelaCompra.id,
            set: {
              casaId: linha.casaId,
              usuarioId: linha.usuarioId,
              status: linha.status,
              valorTotalPago: linha.valorTotalPago,
              criadaEm: linha.criadaEm,
              finalizadaEm: linha.finalizadaEm,
              atualizadoEm: linha.atualizadoEm,
              syncStatus: linha.syncStatus,
            },
          })
          .run();
      }

      for (const item of arquivo.itensCompra) {
        tx.insert(tabelaCompraItem)
          .values(item)
          .onConflictDoUpdate({
            target: tabelaCompraItem.id,
            set: {
              compraId: item.compraId,
              produtoId: item.produtoId,
              nomeAvulso: item.nomeAvulso,
              unidade: item.unidade,
              quantidadePlanejada: item.quantidadePlanejada,
              quantidadeComprada: item.quantidadeComprada,
              valorEstimadoUnit: item.valorEstimadoUnit,
              valorPagoUnitario: item.valorPagoUnitario,
              comprado: item.comprado,
              ordem: item.ordem,
              excluido: item.excluido,
              atualizarPreco: item.atualizarPreco,
            },
          })
          .run();
      }

      // Não passa por MovimentoRepository (append-only por contrato de
      // porta) — a restauração é uma mesclagem em lote, não um registro de
      // consumo, e por isso mexe direto no schema, dentro da mesma
      // transação de tudo o mais.
      for (const movimento of arquivo.movimentos) {
        const linha = { ...movimento, casaId: casaIdLocal };
        tx.insert(movimentoEstoque)
          .values(linha)
          .onConflictDoUpdate({
            target: movimentoEstoque.id,
            set: {
              casaId: linha.casaId,
              produtoId: linha.produtoId,
              usuarioId: linha.usuarioId,
              compraId: linha.compraId,
              tipo: linha.tipo,
              quantidadeDelta: linha.quantidadeDelta,
              quantidadeResultante: linha.quantidadeResultante,
              motivo: linha.motivo,
              criadoEm: linha.criadoEm,
              syncStatus: linha.syncStatus,
            },
          })
          .run();
      }
    });
  }
}
