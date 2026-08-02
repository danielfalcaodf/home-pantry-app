import { SyncStatus } from '../produto/produto';
import { Milesimos } from '../shared/quantidade';

export type TipoMovimento = 'baixa' | 'reposicao' | 'ajuste';

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
