import { ItemDaLista } from '../../domain/lista/lista';
import { formatarNumero, formatarQuantidade } from '../../domain/shared/quantidade';

/**
 * Texto da quantidade a comprar na lista (spec lista-derivada). Produto com
 * fator de conversão exibe pacotes; o excedente ("dá para X") vem à parte em
 * `textoExcedente`, pra caber numa segunda linha na tela sem espremer o
 * nome do produto. Sem fator, comportamento inalterado.
 */
export function textoQuantidadeAComprar(item: ItemDaLista): string {
  if (item.tipo !== 'produto' || item.pacotes === null) {
    return formatarQuantidade(item.quantidadeAComprar, item.unidade);
  }
  const plural = item.pacotes !== 1;
  return `compre ${item.pacotes} ${plural ? 'pacotes' : 'pacote'}`;
}

/**
 * Convite convidativo ("dá para X"), nunca em tom de aviso ou desperdício —
 * `null` quando o produto não tem excedente (ou não tem embalagem).
 */
export function textoExcedente(item: ItemDaLista): string | null {
  if (item.tipo !== 'produto' || item.quantidadeFinalEstimada === null) {
    return null;
  }
  return `dá para ${formatarNumero(item.quantidadeFinalEstimada)}`;
}
