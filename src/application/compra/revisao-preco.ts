import { divergenciaDePreco } from '../../domain/compra/compra.rules';
import { Centavos } from '../../domain/shared/dinheiro';
import { ItemComProduto } from '../../ports/compra.repository';

export type DivergenciaDePrecoDaCompra = {
  itemId: string;
  produtoId: string;
  nome: string;
  precoSalvo: Centavos;
  precoPago: Centavos;
  primeiroPreco: boolean;
};

export function divergenciasDePrecoMarcadas(
  itens: readonly ItemComProduto[],
): DivergenciaDePrecoDaCompra[] {
  return itens.flatMap(({ item, produto }) => {
    if (!item.comprado || produto === null || !divergenciaDePreco(item, produto)) {
      return [];
    }
    return [{
      itemId: item.id,
      produtoId: produto.id,
      nome: produto.nome,
      precoSalvo: produto.valorUnitario,
      precoPago: item.valorPagoUnitario as Centavos,
      primeiroPreco: produto.valorUnitario === 0,
    }];
  });
}
