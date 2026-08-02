import { Compra, CompraItem } from '../domain/compra/compra';
import { EfeitosFinalizacao } from '../domain/compra/compra.rules';
import { Produto } from '../domain/produto/produto';
import { Centavos } from '../domain/shared/dinheiro';
import { Milesimos } from '../domain/shared/quantidade';
import { Unidade } from '../domain/shared/unidade';
import { Result } from '../shared/result';

export type NovoItemCompra = {
  produtoId?: string;
  nomeAvulso?: string;
  unidade: Unidade;
  quantidadePlanejada: Milesimos;
  valorEstimadoUnit?: Centavos;
  ordem?: number;
};

export type EdicaoItemCompra = Partial<
  Pick<
    CompraItem,
    'quantidadePlanejada' | 'quantidadeComprada' | 'valorPagoUnitario' | 'comprado' | 'ordem'
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
   * Aplica os efeitos calculados pelo domínio em UMA transação: reposições,
   * movimentos, atualizações de preço confirmadas e a mudança de status.
   */
  finalizar(
    compraId: string,
    efeitos: EfeitosFinalizacao,
    usuarioId: string,
    finalizadaEm: number,
  ): Promise<Result<Compra, 'nao_encontrada' | 'nao_esta_aberta'>>;
}
