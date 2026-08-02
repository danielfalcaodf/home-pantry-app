import { formatarNumero, formatarQuantidade, Milesimos } from '../../domain/shared/quantidade';
import { Unidade } from '../../domain/shared/unidade';

/** "2 de 3 pacotes" — a leitura que aparece na linha da despensa. */
export function leituraDeEstoque(
  atual: Milesimos,
  necessaria: Milesimos,
  unidade: Unidade,
): string {
  return `${formatarNumero(atual)} de ${formatarQuantidade(necessaria, unidade)}`;
}
