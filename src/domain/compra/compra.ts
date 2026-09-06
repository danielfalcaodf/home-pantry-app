import { FatorConversao } from '../produto/conversao-embalagem.rules';
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
  /**
   * Rastreabilidade de compra em pacotes (change conversao-unidade-de-compra):
   * preenchidos só quando o produto tem fator de conversão cadastrado.
   * `quantidadeComprada` continua a fonte da verdade, calculada como
   * `quantidadePacotes × fatorUsadoNaCompra` — nunca duplicada.
   */
  quantidadePacotes: number | null;
  /** Tamanho de pacote realmente usado nesta compra — pode divergir do
   *  fator cadastrado no produto; a divergência nunca retroalimenta o cadastro. */
  fatorUsadoNaCompra: FatorConversao | null;
  comprado: boolean;
  ordem: number;
  /**
   * Marca que este produto foi removido da lista derivada nesta compra
   * (design `lista-de-compras` D1) — não é um item real, é a exclusão de um
   * faltante. Sempre com `produtoId` preenchido e sem efeito de estoque.
   */
  excluido: boolean;
  /**
   * Resposta à pergunta de atualizar o preço de referência (design D4 da
   * change modo-compra-e-fechamento): `null` quando não perguntado ou não
   * se aplica (item avulso, sem divergência). A escrita em
   * `produto.valorUnitario` só acontece na transação de fechamento.
   */
  atualizarPreco: boolean | null;
};
