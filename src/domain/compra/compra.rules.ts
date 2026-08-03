import { falha, Result, sucesso } from '../../shared/result';
import { MovimentoPendente } from '../movimento/movimento.rules';
import { Produto } from '../produto/produto';
import { Centavos, centavos, multiplicarQuantidadePorPreco } from '../shared/dinheiro';
import { Milesimos, milesimos } from '../shared/quantidade';
import { Compra, CompraItem } from './compra';

/**
 * A data que representa uma linha do histórico (design D5/D6 da change
 * resumo-valores-e-historico): `finalizadaEm` quando a compra fechou, ou o
 * momento do cancelamento quando ela nunca chegou a finalizar — usada tanto
 * para ordenar/paginar quanto para exibir.
 */
export function dataDeReferencia(compra: Pick<Compra, 'finalizadaEm' | 'atualizadoEm'>): number {
  return compra.finalizadaEm ?? compra.atualizadoEm;
}

export type GastoDoMes = { mes: string; totalPago: Centavos; qtdCompras: number };

const MESES_DE_HISTORICO = 12;

// "YYYY-MM" menos `quantos` meses — aritmética pura de calendário, sem
// depender do relógio: o mês de referência é sempre passado por quem chama.
function mesAnterior(mesDeReferencia: string, quantos: number): string {
  const [ano, mes] = mesDeReferencia.split('-').map(Number);
  const data = new Date(ano, mes - 1 - quantos, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Preenche os meses sem compra com zero (design D6/Open Questions da change
 * resumo-valores-e-historico): mantém os últimos doze meses contínuos no
 * eixo do tempo mesmo antes de haver um ano de uso real, do mais recente
 * para o mais antigo.
 */
export function completarMesesSemCompra(
  gastos: readonly GastoDoMes[],
  mesDeReferencia: string,
): GastoDoMes[] {
  const porMes = new Map(gastos.map((gasto) => [gasto.mes, gasto] as const));
  const meses: GastoDoMes[] = [];
  for (let i = 0; i < MESES_DE_HISTORICO; i++) {
    const mes = mesAnterior(mesDeReferencia, i);
    meses.push(porMes.get(mes) ?? { mes, totalPago: centavos(0), qtdCompras: 0 });
  }
  return meses;
}

export function totalPago(itens: readonly CompraItem[]): Centavos {
  let total = 0;
  for (const item of itens) {
    if (!item.comprado) {
      continue;
    }
    const quantidade = item.quantidadeComprada ?? milesimos(0);
    const preco = item.valorPagoUnitario ?? centavos(0);
    total += multiplicarQuantidadePorPreco(quantidade, preco);
  }
  return centavos(total);
}

export type EfeitoReposicao = {
  produtoId: string;
  novaQuantidade: Milesimos;
  movimento: MovimentoPendente;
};

// Reposição no fechamento é `atual += comprado` (PRD apêndice 3, decisão
// registrada no design) — usa a quantidade comprada, não a planejada.
export function efeitoDeReposicao(
  item: CompraItem,
  produto: Produto | undefined,
): EfeitoReposicao | null {
  if (item.produtoId === null || produto === undefined) {
    return null;
  }
  const comprada = item.quantidadeComprada;
  if (comprada === null || comprada <= 0) {
    return null;
  }
  return {
    produtoId: produto.id,
    novaQuantidade: milesimos(produto.quantidadeAtual + comprada),
    movimento: { tipo: 'reposicao', variacao: comprada },
  };
}

// Divergência inclui produto sem preço cadastrado (0): é o caminho para o
// primeiro preço entrar mediante confirmação. Só depende de valorUnitario —
// aceita o Pick trazido pela junção externa de listarItens, sem exigir o
// Produto inteiro.
export function divergenciaDePreco(
  item: CompraItem,
  produto: Pick<Produto, 'valorUnitario'>,
): boolean {
  if (item.valorPagoUnitario === null) {
    return false;
  }
  return item.valorPagoUnitario !== produto.valorUnitario;
}

export type AtualizacaoDePreco = {
  produtoId: string;
  novoValorUnitario: Centavos;
};

export type EfeitosFinalizacao = {
  reposicoes: EfeitoReposicao[];
  atualizacoesDePreco: AtualizacaoDePreco[];
  totalPago: Centavos;
};

export type ErroFinalizacao = {
  motivo: 'quantidade_comprada_ausente';
  itemId: string;
};

// Tudo ou nada: a persistência aplica este bloco em uma única transação.
// Qualquer item marcado inválido produz falha sem nenhum efeito parcial.
export function efeitosDaFinalizacao(
  itens: readonly CompraItem[],
  produtos: readonly Produto[],
  produtosComPrecoConfirmado: ReadonlySet<string>,
): Result<EfeitosFinalizacao, ErroFinalizacao> {
  const porId = new Map(produtos.map((produto) => [produto.id, produto]));
  const marcados = itens.filter((item) => item.comprado);

  for (const item of marcados) {
    if (item.quantidadeComprada === null) {
      return falha({ motivo: 'quantidade_comprada_ausente', itemId: item.id });
    }
  }

  const reposicoes: EfeitoReposicao[] = [];
  const atualizacoesDePreco: AtualizacaoDePreco[] = [];

  for (const item of marcados) {
    const produto = item.produtoId === null ? undefined : porId.get(item.produtoId);
    const reposicao = efeitoDeReposicao(item, produto);
    if (reposicao !== null) {
      reposicoes.push(reposicao);
    }
    if (
      produto !== undefined &&
      item.valorPagoUnitario !== null &&
      divergenciaDePreco(item, produto) &&
      produtosComPrecoConfirmado.has(produto.id)
    ) {
      atualizacoesDePreco.push({
        produtoId: produto.id,
        novoValorUnitario: item.valorPagoUnitario,
      });
    }
  }

  return sucesso({ reposicoes, atualizacoesDePreco, totalPago: totalPago(itens) });
}
