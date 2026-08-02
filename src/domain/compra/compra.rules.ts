import { falha, Result, sucesso } from '../../shared/result';
import { MovimentoPendente } from '../movimento/movimento.rules';
import { Produto } from '../produto/produto';
import { Centavos, centavos, multiplicarQuantidadePorPreco } from '../shared/dinheiro';
import { Milesimos, milesimos } from '../shared/quantidade';
import { CompraItem } from './compra';

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
// primeiro preço entrar mediante confirmação.
export function divergenciaDePreco(item: CompraItem, produto: Produto): boolean {
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
