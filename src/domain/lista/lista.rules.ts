import { CompraItem } from '../compra/compra';
import { FaltanteBruto } from '../produto/produto';
import { centavos, multiplicarQuantidadePorPreco } from '../shared/dinheiro';
import { custoReposicao, detalheDaQuantidadeAComprar } from '../produto/estoque.rules';
import { milesimos } from '../shared/quantidade';
import { ItemDaLista, TotalDaListaDeCompras } from './lista';

export function itemDeFaltante(faltante: FaltanteBruto): ItemDaLista {
  const { custo, semPreco } = custoReposicao(faltante);
  const detalhe = detalheDaQuantidadeAComprar(faltante);
  return {
    tipo: 'produto',
    produtoId: faltante.id,
    nome: faltante.nome,
    categoria: faltante.categoria,
    unidade: faltante.unidade,
    quantidadeAComprar: detalhe.quantidade,
    valorUnitario: faltante.valorUnitario,
    custo,
    semPreco,
    pacotes: detalhe.pacotes,
    quantidadeFinalEstimada:
      detalhe.pacotes !== null && detalhe.excedente > 0
        ? milesimos(faltante.quantidadeAtual + detalhe.quantidade)
        : null,
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
    valorUnitario: item.valorEstimadoUnit,
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
