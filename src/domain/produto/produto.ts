import { FatorConversao } from './conversao-embalagem.rules';
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
  /** Opcional, só para unidade indivisível (change conversao-unidade-de-compra). */
  fatorConversaoEmbalagem: FatorConversao | null;
  /** centavos, valor de referência do pacote fechado. */
  valorReferenciaEmbalagem: Centavos | null;
  ativo: boolean;
  criadoEm: number;
  atualizadoEm: number;
  deletadoEm: number | null;
  syncStatus: SyncStatus;
};

// Valores brutos de banco: sem arredondamento e sem conversão de moeda —
// o domínio arredonda e converte (DATABASE §6.2). Mora aqui, não em
// `ports/`, porque `domain/lista/lista.rules.ts` consome esta forma sem
// depender de interface de repositório (regra de dependência não permite
// domain → ports).
export type FaltanteBruto = {
  id: string;
  nome: string;
  categoria: string | null;
  unidade: Unidade;
  valorUnitario: Centavos;
  quantidadeAtual: Milesimos;
  quantidadeNecessaria: Milesimos;
  faltaBruta: Milesimos;
  fatorConversaoEmbalagem: FatorConversao | null;
  valorReferenciaEmbalagem: Centavos | null;
};
