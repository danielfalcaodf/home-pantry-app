import { TipoMovimento } from '../../domain/movimento/movimento';
import { formatarQuantidade, Milesimos, milesimos } from '../../domain/shared/quantidade';
import { Unidade } from '../../domain/shared/unidade';

export type MovimentoDoHistorico = {
  tipo: TipoMovimento;
  quantidadeDelta: Milesimos;
  quantidadeResultante: Milesimos;
  compraId: string | null;
};

export type DescricaoDeMovimento = {
  /** Verbo em papel de corpo — mesmo nome do começo ao fim (task 5.6). */
  verbo: string;
  /** Valor em papel de dado (task 5.5) — família monoespaçada. */
  quantidade: string;
};

/**
 * Mesmo verbo do momento da ação (task 5.6, FRONTEND §11: "Dar baixa" →
 * "Usei", "Reposição" → "Repus"/"Comprei"). Nunca "dar baixa", "movimento
 * de estoque" nem "reposição" aparecem aqui — são termos de sistema.
 */
export function descreverMovimento(
  movimento: MovimentoDoHistorico,
  unidade: Unidade,
): DescricaoDeMovimento {
  if (movimento.tipo === 'baixa') {
    return {
      verbo: 'Usei',
      quantidade: formatarQuantidade(milesimos(-movimento.quantidadeDelta), unidade),
    };
  }
  if (movimento.tipo === 'reposicao') {
    return {
      verbo: movimento.compraId !== null ? 'Comprei' : 'Repus',
      quantidade: formatarQuantidade(movimento.quantidadeDelta, unidade),
    };
  }
  // Ajuste é sobre o valor final contado, não a variação (design D2) —
  // descrever pelo resultado é o que a pessoa reconhece ter feito.
  return {
    verbo: 'Corrigi para',
    quantidade: formatarQuantidade(movimento.quantidadeResultante, unidade),
  };
}

export function formatarDataDoMovimento(criadoEm: number): string {
  const data = new Date(criadoEm);
  const dataFormatada = data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dataFormatada} às ${horaFormatada}`;
}
