import { formatarBRL } from '../../domain/shared/dinheiro';
import { formatarNumero, formatarQuantidade } from '../../domain/shared/quantidade';
import { Unidade } from '../../domain/shared/unidade';
import { Centavos } from '../../domain/shared/dinheiro';
import { Milesimos } from '../../domain/shared/quantidade';

/** "2 de 3 pacotes" — a leitura que aparece na linha da despensa. */
export function leituraDeEstoque(
  atual: Milesimos,
  necessaria: Milesimos,
  unidade: Unidade,
): string {
  return `${formatarNumero(atual)} de ${formatarQuantidade(necessaria, unidade)}`;
}

export { formatarBRL, formatarQuantidade };
export type { Centavos, Milesimos, Unidade };
