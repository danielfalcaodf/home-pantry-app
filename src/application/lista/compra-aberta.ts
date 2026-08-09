import { Compra } from '../../domain/compra/compra';
import { CompraRepository } from '../../ports/compra.repository';

/**
 * Sob demanda, nunca na abertura do app (design D2): nasce quando o primeiro
 * avulso é adicionado ou o primeiro item é removido da lista. Corrida entre
 * duas chamadas é resolvida pelo índice único do banco — `abrir` falhando
 * apenas significa que outra chamada venceu, e reusamos a dela.
 */
export async function obterOuAbrirCompra(
  compras: CompraRepository,
  casaId: string,
  usuarioId: string,
  agora: number,
): Promise<Compra> {
  const existente = await compras.obterAberta(casaId);
  if (existente) {
    return existente;
  }
  const resultado = await compras.abrir(casaId, usuarioId, agora);
  if (resultado.ok) {
    return resultado.valor;
  }
  const abertaPorOutraChamada = await compras.obterAberta(casaId);
  if (!abertaPorOutraChamada) {
    throw new Error('compra aberta esperada após corrida de criação');
  }
  return abertaPorOutraChamada;
}
