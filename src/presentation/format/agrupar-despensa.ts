import { EstadoItem } from '../../domain/produto/estoque.rules';

// 'faltando' é um filtro só de apresentação (chip da Despensa, spec
// tela-despensa) que soma os estados 'critico' e 'emFalta' — os valores de
// EstadoItem continuam existindo para rotas que já apontavam para um estado
// isolado (ex.: Resumo → `/?filtro=emFalta`), mesmo sem chip próprio na tela.
export type FiltroEstado = 'tudo' | EstadoItem | 'faltando';

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
  const critico = itens.filter((i) => i.estado === 'critico').length;
  const emFalta = itens.filter((i) => i.estado === 'emFalta').length;
  return {
    tudo: itens.length,
    critico,
    emFalta,
    ok: itens.filter((i) => i.estado === 'ok').length,
    faltando: critico + emFalta,
  };
}

/** Casa um item com o filtro ativo — 'faltando' é o único filtro composto. */
export function casaComFiltro(estado: EstadoItem, filtro: FiltroEstado): boolean {
  if (filtro === 'tudo') {
    return true;
  }
  if (filtro === 'faltando') {
    return estado === 'critico' || estado === 'emFalta';
  }
  return estado === filtro;
}
