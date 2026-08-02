import { formatarQuantidade, Milesimos } from '../../domain/shared/quantidade';
import { Unidade } from '../../domain/shared/unidade';

/**
 * A ação mantém o mesmo nome do começo ao fim: botão "Usei" → confirmação
 * "Anotado" (FRONTEND §11). Nenhum termo de sistema aparece aqui.
 */
export function mensagemDeConsumo(
  nome: string,
  quantidade: Milesimos,
  unidade: Unidade,
): string {
  return `Anotado: ${formatarQuantidade(quantidade, unidade)} de ${nome}`;
}

export function mensagemDeReposicao(
  nome: string,
  quantidade: Milesimos,
  unidade: Unidade,
): string {
  return `Anotado: repus ${formatarQuantidade(quantidade, unidade)} de ${nome}`;
}

export function mensagemDeItemAcabado(nome: string): string {
  return `${nome} acabou`;
}

export const MENSAGEM_ESTOQUE_ZERADO = 'Esse item já está zerado';
export const MENSAGEM_FALHA_AO_GRAVAR = 'Não deu para anotar agora';
