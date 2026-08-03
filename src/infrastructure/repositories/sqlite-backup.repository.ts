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
import { casa as tabelaCasa, usuario as tabelaUsuario } from '../db/schema';
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
}
