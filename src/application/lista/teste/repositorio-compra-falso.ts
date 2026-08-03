import { Compra, CompraItem } from '../../../domain/compra/compra';
import { EfeitosFinalizacao, GastoDoMes } from '../../../domain/compra/compra.rules';
import { centavos } from '../../../domain/shared/dinheiro';
import { milesimos } from '../../../domain/shared/quantidade';
import {
  CompraRepository,
  EdicaoItemCompra,
  ItemComProduto,
  NovoItemCompra,
} from '../../../ports/compra.repository';
import { falha, Result, sucesso } from '../../../shared/result';
import { ProdutoRepositorioFalso } from '../../estoque/teste/repositorio-falso';

/**
 * Substituível pelo SQLite real sem o caso de uso saber a diferença (LSP) —
 * espelha a unicidade de compra aberta e a junção externa com produto.
 */
export class CompraRepositorioFalso implements CompraRepository {
  compras: Compra[] = [];
  itens: CompraItem[] = [];
  private proximoId = 1;

  constructor(private readonly produtos?: ProdutoRepositorioFalso) {}

  async abrir(
    casaId: string,
    usuarioId: string,
    criadaEm: number,
  ): Promise<Result<Compra, 'ja_existe_aberta'>> {
    if (this.compras.some((c) => c.casaId === casaId && c.status === 'aberta')) {
      return falha('ja_existe_aberta');
    }
    this.proximoId += 1;
    const compra: Compra = {
      id: `compra-${this.proximoId}`,
      casaId,
      usuarioId,
      status: 'aberta',
      valorTotalPago: null,
      criadaEm,
      finalizadaEm: null,
      atualizadoEm: criadaEm,
      syncStatus: 'local',
    };
    this.compras.push(compra);
    return sucesso(compra);
  }

  async obterAberta(casaId: string): Promise<Compra | null> {
    return this.compras.find((c) => c.casaId === casaId && c.status === 'aberta') ?? null;
  }

  async adicionarItem(compraId: string, item: NovoItemCompra): Promise<CompraItem> {
    this.proximoId += 1;
    const ordem = item.ordem ?? this.itens.filter((i) => i.compraId === compraId).length;
    const criado: CompraItem = {
      id: `item-${this.proximoId}`,
      compraId,
      produtoId: item.produtoId ?? null,
      nomeAvulso: item.nomeAvulso ?? null,
      unidade: item.unidade,
      quantidadePlanejada: item.quantidadePlanejada,
      quantidadeComprada: null,
      valorEstimadoUnit: item.valorEstimadoUnit ?? centavos(0),
      valorPagoUnitario: null,
      comprado: false,
      ordem,
      excluido: item.excluido ?? false,
      atualizarPreco: null,
    };
    this.itens.push(criado);
    return criado;
  }

  async editarItem(itemId: string, dados: EdicaoItemCompra): Promise<void> {
    const indice = this.itens.findIndex((i) => i.id === itemId);
    if (indice !== -1) {
      this.itens[indice] = { ...this.itens[indice], ...dados };
    }
  }

  async removerItem(itemId: string): Promise<void> {
    this.itens = this.itens.filter((i) => i.id !== itemId);
  }

  async cancelar(
    compraId: string,
    canceladaEm: number,
  ): Promise<Result<Compra, 'nao_encontrada' | 'nao_esta_aberta'>> {
    const indice = this.compras.findIndex((c) => c.id === compraId);
    if (indice === -1) {
      return falha('nao_encontrada');
    }
    if (this.compras[indice].status !== 'aberta') {
      return falha('nao_esta_aberta');
    }
    this.compras[indice] = {
      ...this.compras[indice],
      status: 'cancelada',
      atualizadoEm: canceladaEm,
    };
    return sucesso(this.compras[indice]);
  }

  async listarItens(compraId: string): Promise<ItemComProduto[]> {
    return this.itens
      .filter((item) => item.compraId === compraId)
      .sort((a, b) => a.ordem - b.ordem)
      .map((item) => {
        const produto =
          item.produtoId === null
            ? null
            : (this.produtos?.produtos.find((p) => p.id === item.produtoId) ?? null);
        return {
          item,
          produto:
            produto === null
              ? null
              : {
                  id: produto.id,
                  nome: produto.nome,
                  categoria: produto.categoria,
                  unidade: produto.unidade,
                  valorUnitario: produto.valorUnitario,
                },
        };
      });
  }

  async finalizar(
    compraId: string,
    efeitos: EfeitosFinalizacao,
    _usuarioId: string,
    finalizadaEm: number,
  ): Promise<Result<Compra, 'nao_encontrada' | 'nao_esta_aberta'>> {
    const indice = this.compras.findIndex((c) => c.id === compraId);
    if (indice === -1) {
      return falha('nao_encontrada');
    }
    if (this.compras[indice].status !== 'aberta') {
      return falha('nao_esta_aberta');
    }
    if (this.produtos) {
      for (const reposicao of efeitos.reposicoes) {
        const idx = this.produtos.produtos.findIndex((p) => p.id === reposicao.produtoId);
        if (idx !== -1) {
          this.produtos.produtos[idx] = {
            ...this.produtos.produtos[idx],
            quantidadeAtual: milesimos(reposicao.novaQuantidade),
          };
        }
      }
      for (const atualizacao of efeitos.atualizacoesDePreco) {
        const idx = this.produtos.produtos.findIndex((p) => p.id === atualizacao.produtoId);
        if (idx !== -1) {
          this.produtos.produtos[idx] = {
            ...this.produtos.produtos[idx],
            valorUnitario: atualizacao.novoValorUnitario,
          };
        }
      }
    }
    this.compras[indice] = {
      ...this.compras[indice],
      status: 'finalizada',
      finalizadaEm,
      valorTotalPago: efeitos.totalPago,
      atualizadoEm: finalizadaEm,
    };
    return sucesso(this.compras[indice]);
  }

  // Espelha o strftime('localtime') do SQLite usando o fuso local do
  // processo (Date getters), não UTC.
  async gastoPorMes(casaId: string, desdeEm: number): Promise<GastoDoMes[]> {
    const porMes = new Map<string, { totalPago: number; qtdCompras: number }>();
    for (const c of this.compras) {
      if (c.casaId !== casaId || c.status !== 'finalizada' || c.finalizadaEm === null) {
        continue;
      }
      if (c.finalizadaEm < desdeEm) {
        continue;
      }
      const data = new Date(c.finalizadaEm);
      const mes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      const atual = porMes.get(mes) ?? { totalPago: 0, qtdCompras: 0 };
      porMes.set(mes, {
        totalPago: atual.totalPago + (c.valorTotalPago ?? 0),
        qtdCompras: atual.qtdCompras + 1,
      });
    }
    return [...porMes.entries()]
      .map(([mes, dados]) => ({ mes, totalPago: centavos(dados.totalPago), qtdCompras: dados.qtdCompras }))
      .sort((a, b) => b.mes.localeCompare(a.mes));
  }

  async listarTudoParaBackup(casaId: string): Promise<{ compra: Compra; itens: CompraItem[] }[]> {
    return this.compras
      .filter((c) => c.casaId === casaId)
      .map((compra) => ({
        compra,
        itens: this.itens
          .filter((i) => i.compraId === compra.id)
          .sort((a, b) => a.ordem - b.ordem),
      }));
  }
}
