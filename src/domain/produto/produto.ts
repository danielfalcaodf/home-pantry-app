import { Centavos } from '../shared/dinheiro';
import { Milesimos } from '../shared/quantidade';
import { Unidade } from '../shared/unidade';

export type SyncStatus = 'local' | 'pendente' | 'sincronizado';

// Espelha as colunas de produto em DATABASE §4.
export type Produto = {
  id: string;
  casaId: string;
  nome: string;
  categoria: string | null;
  unidade: Unidade;
  quantidadeAtual: Milesimos;
  quantidadeNecessaria: Milesimos;
  valorUnitario: Centavos;
  marcaPreferida: string | null;
  observacao: string | null;
  ativo: boolean;
  criadoEm: number;
  atualizadoEm: number;
  deletadoEm: number | null;
  syncStatus: SyncStatus;
};
