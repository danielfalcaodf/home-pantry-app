import { EstadoItem } from '../../domain/produto/estoque.rules';

export type FiltroEstado = 'tudo' | EstadoItem;

export type ItemAgrupavel = {
  produto: { id: string; nome: string; categoria: string | null };
  estado: EstadoItem;
};

export const SEM_CATEGORIA = 'Sem categoria';

export type LinhaDaLista<T> =
  | { tipo: 'cabecalho'; categoria: string; chave: string }
  | { tipo: 'item'; item: T; chave: string };

/**
 * Agrupamento é decisão de layout, não de dados — por isso acontece aqui e
 * não no SQL. A ordem dos itens dentro do grupo é a que veio da consulta.
 */
export function agruparPorCategoria<T extends ItemAgrupavel>(itens: T[]): LinhaDaLista<T>[] {
  const grupos = new Map<string, T[]>();
  for (const item of itens) {
    const categoria = item.produto.categoria ?? SEM_CATEGORIA;
    const atual = grupos.get(categoria);
    if (atual) {
      atual.push(item);
    } else {
      grupos.set(categoria, [item]);
    }
  }

  // Alfabética, com "Sem categoria" sempre por último.
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
    ...(grupos.get(categoria) as T[]).map((item) => ({
      tipo: 'item' as const,
      item,
      chave: item.produto.id,
    })),
  ]);
}

export function contarPorEstado(itens: ItemAgrupavel[]): Record<FiltroEstado, number> {
  return {
    tudo: itens.length,
    critico: itens.filter((i) => i.estado === 'critico').length,
    emFalta: itens.filter((i) => i.estado === 'emFalta').length,
    ok: itens.filter((i) => i.estado === 'ok').length,
  };
}
