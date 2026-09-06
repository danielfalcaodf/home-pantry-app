import { ItemDaLista, TotalDaListaDeCompras } from '../../domain/lista/lista';
import { formatarBRL } from '../../domain/shared/dinheiro';
import { agruparListaPorCategoria } from './agrupar-lista';
import { textoExcedente, textoQuantidadeAComprar } from './quantidade-a-comprar';

const CABECALHO = 'Lista de compras';

function linhaDoItem(item: ItemDaLista): string {
  const excedente = textoExcedente(item);
  const quantidade = excedente
    ? `${textoQuantidadeAComprar(item)} (${excedente})`
    : textoQuantidadeAComprar(item);
  const preco = item.semPreco ? 'sem preço' : formatarBRL(item.custo);
  const nome = item.tipo === 'avulso' ? `${item.nome} (avulso)` : item.nome;
  return `- ${nome} — ${quantidade} — ${preco}`;
}

/**
 * Texto simples pela folha de compartilhamento do sistema (design D6): sem
 * jargão de sistema, sem identificador interno — só o que aparece na tela.
 */
export function gerarTextoDaLista(
  itens: readonly ItemDaLista[],
  agrupado: boolean,
  total: TotalDaListaDeCompras,
): string {
  if (itens.length === 0) {
    return '';
  }

  const linhas: string[] = [CABECALHO, ''];

  if (agrupado) {
    for (const linha of agruparListaPorCategoria(itens)) {
      if (linha.tipo === 'cabecalho') {
        linhas.push(linha.categoria.toUpperCase());
      } else {
        linhas.push(linhaDoItem(linha.item));
      }
    }
  } else {
    for (const item of [...itens].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))) {
      linhas.push(linhaDoItem(item));
    }
  }

  linhas.push('');
  linhas.push(`Total estimado: ${formatarBRL(total.total)}`);
  if (total.contagemSemPreco > 0) {
    linhas.push(`(${total.contagemSemPreco} item(ns) sem preço cadastrado, não incluído no total)`);
  }

  return linhas.join('\n');
}
