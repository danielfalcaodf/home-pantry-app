import { SyncStatus } from '../produto/produto';
import { Centavos } from '../shared/dinheiro';
import { Milesimos } from '../shared/quantidade';
import { Unidade } from '../shared/unidade';

export type StatusCompra = 'aberta' | 'finalizada' | 'cancelada';

// Espelha compra em DATABASE §4.
export type Compra = {
  id: string;
  casaId: string;
  usuarioId: string;
  status: StatusCompra;
  valorTotalPago: Centavos | null;
  criadaEm: number;
  finalizadaEm: number | null;
  atualizadoEm: number;
  syncStatus: SyncStatus;
};

// Espelha compra_item em DATABASE §4.
// Ou referencia um produto do estoque, ou é avulso com nome próprio.
export type CompraItem = {
  id: string;
  compraId: string;
  produtoId: string | null;
  nomeAvulso: string | null;
  unidade: Unidade;
  quantidadePlanejada: Milesimos;
  quantidadeComprada: Milesimos | null;
  valorEstimadoUnit: Centavos;
  valorPagoUnitario: Centavos | null;
  comprado: boolean;
  ordem: number;
};
