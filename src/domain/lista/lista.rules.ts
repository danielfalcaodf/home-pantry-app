import { CompraItem } from '../compra/compra';
import { FaltanteBruto } from '../../ports/produto.repository';
import { centavos, multiplicarQuantidadePorPreco } from '../shared/dinheiro';
import { custoReposicao, quantidadeAComprar } from '../produto/estoque.rules';
import { ItemDaLista, TotalDaListaDeCompras } from './lista';

export function itemDeFaltante(faltante: FaltanteBruto): ItemDaLista {
  const { custo, semPreco } = custoReposicao(faltante);
  return {
    tipo: 'produto',
    produtoId: faltante.id,
    nome: faltante.nome,
    categoria: faltante.categoria,
    unidade: faltante.unidade,
    quantidadeAComprar: quantidadeAComprar(faltante),
    custo,
    semPreco,
  };
}

export function itemDeAvulso(item: CompraItem): ItemDaLista {
  const semPreco = item.valorEstimadoUnit <= 0;
  return {
    tipo: 'avulso',
    itemId: item.id,
    nome: item.nomeAvulso ?? '',
    categoria: null,
    unidade: item.unidade,
    quantidadeAComprar: item.quantidadePlanejada,
    custo: semPreco
      ? centavos(0)
      : multiplicarQuantidadePorPreco(item.quantidadePlanejada, item.valorEstimadoUnit),
    semPreco,
  };
}

/**
 * A lista nunca é materializada (DATABASE §2): esta função só combina o que
 * já veio de duas consultas — faltantes menos exclusões, mais avulsos da
 * compra aberta. Nenhum acesso a repositório aqui.
 */
export function compuserLista(
  faltantes: readonly FaltanteBruto[],
  avulsos: readonly CompraItem[],
  idsExcluidos: ReadonlySet<string>,
): ItemDaLista[] {
  const doEstoque = faltantes
    .filter((faltante) => !idsExcluidos.has(faltante.id))
    .map(itemDeFaltante);
  return [...doEstoque, ...avulsos.map(itemDeAvulso)];
}

export function totalDaListaDeCompras(itens: readonly ItemDaLista[]): TotalDaListaDeCompras {
  let total = 0;
  let contagemSemPreco = 0;
  for (const item of itens) {
    if (item.semPreco) {
      contagemSemPreco += 1;
    } else {
      total += item.custo;
    }
  }
  return { total: centavos(total), contagemItens: itens.length, contagemSemPreco };
}
