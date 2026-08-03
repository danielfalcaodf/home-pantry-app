import { Compra, CompraItem } from '../domain/compra/compra';
import { EfeitosFinalizacao, GastoDoMes } from '../domain/compra/compra.rules';
import { Produto } from '../domain/produto/produto';
import { Centavos } from '../domain/shared/dinheiro';
import { Milesimos } from '../domain/shared/quantidade';
import { Unidade } from '../domain/shared/unidade';
import { Result } from '../shared/result';

export type { GastoDoMes } from '../domain/compra/compra.rules';

export type NovoItemCompra = {
  produtoId?: string;
  nomeAvulso?: string;
  unidade: Unidade;
  quantidadePlanejada: Milesimos;
  valorEstimadoUnit?: Centavos;
  ordem?: number;
  /** Ver `CompraItem.excluido` — marca a exclusão de um faltante da lista. */
  excluido?: boolean;
};

export type EdicaoItemCompra = Partial<
  Pick<
    CompraItem,
    | 'nomeAvulso'
    | 'unidade'
    | 'quantidadePlanejada'
    | 'quantidadeComprada'
    | 'valorEstimadoUnit'
    | 'valorPagoUnitario'
    | 'comprado'
    | 'ordem'
    | 'atualizarPreco'
  >
>;

// Item da compra com os dados do produto trazidos por junção externa em uma
// única consulta — item avulso vem com produto null (DATABASE §6.7).
export type ItemComProduto = {
  item: CompraItem;
  produto: Pick<Produto, 'id' | 'nome' | 'categoria' | 'unidade' | 'valorUnitario'> | null;
};

export interface CompraRepository {
  /** No máximo uma compra aberta por casa (ux_compra_aberta). */
  abrir(casaId: string, usuarioId: string, criadaEm: number): Promise<Result<Compra, 'ja_existe_aberta'>>;
  obterAberta(casaId: string): Promise<Compra | null>;
  adicionarItem(compraId: string, item: NovoItemCompra): Promise<CompraItem>;
  editarItem(itemId: string, dados: EdicaoItemCompra): Promise<void>;
  removerItem(itemId: string): Promise<void>;
  listarItens(compraId: string): Promise<ItemComProduto[]>;
  /**
   * Situação `cancelada` (design "Open Questions"): não repõe nada, apenas
   * libera `ux_compra_aberta` para uma compra nova. A compra permanece no
   * histórico, nunca é apagada.
   */
  cancelar(
    compraId: string,
    canceladaEm: number,
  ): Promise<Result<Compra, 'nao_encontrada' | 'nao_esta_aberta'>>;
  /**
   * Aplica os efeitos calculados pelo domínio em UMA transação: reposições,
   * movimentos, atualizações de preço confirmadas e a mudança de status.
   */
  finalizar(
    compraId: string,
    efeitos: EfeitosFinalizacao,
    usuarioId: string,
    finalizadaEm: number,
  ): Promise<Result<Compra, 'nao_encontrada' | 'nao_esta_aberta'>>;
  /** Todas as compras da casa (aberta, finalizada, cancelada) com seus itens — uso exclusivo do backup. */
  listarTudoParaBackup(casaId: string): Promise<{ compra: Compra; itens: CompraItem[] }[]>;
  /**
   * Gasto por mês das compras finalizadas desde `desdeEm`, agregado no fuso
   * horário local (DATABASE §6.5, design D4) — nunca em tempo universal, ou
   * uma compra fechada perto da meia-noite cairia no mês seguinte. Só
   * `status = 'finalizada'` entra (design D5): cancelada não é gasto.
   */
  gastoPorMes(casaId: string, desdeEm: number): Promise<GastoDoMes[]>;
}
