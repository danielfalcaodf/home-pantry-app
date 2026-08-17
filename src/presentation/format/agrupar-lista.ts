import { ItemDaLista } from '../../domain/lista/lista';
import { SEM_CATEGORIA } from './agrupar-despensa';

export type LinhaAgrupavel<T> =
  | { tipo: 'cabecalho'; categoria: string; chave: string }
  | { tipo: 'item'; item: T; chave: string };

export type LinhaDaListaDeCompras = LinhaAgrupavel<ItemDaLista>;

function chaveDoItem(item: ItemDaLista): string {
  return item.tipo === 'produto' ? item.produtoId : item.itemId;
}

/**
 * Núcleo genérico do agrupamento por categoria — mesmo critério de
 * ordenação da despensa (alfabética, "Sem categoria" por último). Usado
 * pela Lista (`ItemDaLista`) e pelo Modo Compra (`ItemDaCompra`), que têm
 * formas diferentes mas a mesma necessidade de agrupamento — zero lógica
 * duplicada entre as duas telas (correcao-agrupamento-modo-compra, A-08).
 */
export function agruparPorCategoriaGenerico<T>(
  itens: readonly T[],
  categoriaDoItem: (item: T) => string | null,
  nomeDoItem: (item: T) => string,
  chave: (item: T) => string,
): LinhaAgrupavel<T>[] {
  const grupos = new Map<string, T[]>();
  for (const item of itens) {
    const categoria = categoriaDoItem(item) ?? SEM_CATEGORIA;
    const atual = grupos.get(categoria);
    if (atual) {
      atual.push(item);
    } else {
      grupos.set(categoria, [item]);
    }
  }

  const categorias = [...grupos.keys()].sort((a, b) => {
    if (a === SEM_CATEGORIA) {
      return 1;
    }
    if (b === SEM_CATEGORIA) {
      return -1;
    }
    return a.localeCompare(b, 'pt-BR');
  });

  return categorias.flatMap((categoria) => [
    { tipo: 'cabecalho' as const, categoria, chave: `cabecalho-${categoria}` },
    ...(grupos.get(categoria) as T[])
      .sort((a, b) => nomeDoItem(a).localeCompare(nomeDoItem(b), 'pt-BR'))
      .map((item) => ({ tipo: 'item' as const, item, chave: chave(item) })),
  ]);
}

export function listaContinuaGenerico<T>(
  itens: readonly T[],
  nomeDoItem: (item: T) => string,
  chave: (item: T) => string,
): LinhaAgrupavel<T>[] {
  return [...itens]
    .sort((a, b) => nomeDoItem(a).localeCompare(nomeDoItem(b), 'pt-BR'))
    .map((item) => ({ tipo: 'item' as const, item, chave: chave(item) }));
}

export function agruparListaPorCategoria(itens: readonly ItemDaLista[]): LinhaDaListaDeCompras[] {
  return agruparPorCategoriaGenerico(
    itens,
    (item) => item.categoria,
    (item) => item.nome,
    chaveDoItem,
  );
}

export function listaContinua(itens: readonly ItemDaLista[]): LinhaDaListaDeCompras[] {
  return listaContinuaGenerico(itens, (item) => item.nome, chaveDoItem);
}
