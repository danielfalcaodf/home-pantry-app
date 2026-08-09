import { SyncStatus } from '../produto/produto';
import { Milesimos } from '../shared/quantidade';

export type TipoMovimento = 'baixa' | 'reposicao' | 'ajuste';

/** Sugestões de motivo do ajuste (task 1.5) — sempre opcional. */
export type MotivoAjuste = 'perda' | 'vencimento' | 'correcao';

// Espelha movimento_estoque em DATABASE §4 — tabela append-only.
export type MovimentoEstoque = {
  id: string;
  casaId: string;
  produtoId: string;
  usuarioId: string;
  compraId: string | null;
  tipo: TipoMovimento;
  quantidadeDelta: Milesimos;
  quantidadeResultante: Milesimos;
  motivo: string | null;
  criadoEm: number;
  syncStatus: SyncStatus;
};
