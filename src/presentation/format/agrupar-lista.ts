import { ItemDaLista } from '../../domain/lista/lista';
import { SEM_CATEGORIA } from './agrupar-despensa';

export type LinhaDaListaDeCompras =
  | { tipo: 'cabecalho'; categoria: string; chave: string }
  | { tipo: 'item'; item: ItemDaLista; chave: string };

function chaveDoItem(item: ItemDaLista): string {
  return item.tipo === 'produto' ? item.produtoId : item.itemId;
}

/**
 * Mesmo critério de ordenação da despensa (alfabética, "Sem categoria" por
 * último) — avulsos não têm categoria e caem sempre nesse grupo.
 */
export function agruparListaPorCategoria(itens: readonly ItemDaLista[]): LinhaDaListaDeCompras[] {
  const grupos = new Map<string, ItemDaLista[]>();
  for (const item of itens) {
    const categoria = item.categoria ?? SEM_CATEGORIA;
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
    ...(grupos.get(categoria) as ItemDaLista[])
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      .map((item) => ({ tipo: 'item' as const, item, chave: chaveDoItem(item) })),
  ]);
}

export function listaContinua(itens: readonly ItemDaLista[]): LinhaDaListaDeCompras[] {
  return [...itens]
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((item) => ({ tipo: 'item' as const, item, chave: chaveDoItem(item) }));
}
