import { Produto } from '../../../domain/produto/produto';
import { ProdutoValidado } from '../../../domain/produto/validacao';
import { centavos } from '../../../domain/shared/dinheiro';
import { Milesimos, milesimos } from '../../../domain/shared/quantidade';
import { MovimentoRepository } from '../../../ports/movimento.repository';
import { ObservadorDeMudancas } from '../../../ports/observador-de-mudancas';
import {
  ComandoBaixa,
  ErroEscritaProduto,
  FaltanteBruto,
  ItemListaBase,
  ProdutoRepository,
  ResultadoBaixa,
} from '../../../ports/produto.repository';
import { falha, Result, sucesso } from '../../../shared/result';

export function produtoFalso(sobrescreve: Partial<Produto> = {}): Produto {
  return {
    id: 'p1',
    casaId: 'casa-teste',
    nome: 'Arroz',
    categoria: 'Grãos',
    unidade: 'pacote',
    quantidadeAtual: milesimos(2000),
    quantidadeNecessaria: milesimos(3000),
    valorUnitario: centavos(890),
    marcaPreferida: null,
    observacao: null,
    ativo: true,
    criadoEm: 0,
    atualizadoEm: 0,
    deletadoEm: null,
    syncStatus: 'local',
    ...sobrescreve,
  };
}

/**
 * Substituível pelo real sem o caso de uso saber a diferença (LSP) — é o que
 * permite testar `application/` sem SQLite.
 */
export class ProdutoRepositorioFalso implements ProdutoRepository {
  constructor(public produtos: Produto[] = []) {}

  private proximoId = 1;

  async criar(
    casaId: string,
    _usuarioId: string,
    dados: ProdutoValidado,
  ): Promise<Result<Produto, ErroEscritaProduto>> {
    const jaExiste = this.produtos.some(
      (p) => p.deletadoEm === null && p.nome.toLowerCase() === dados.nome.toLowerCase(),
    );
    if (jaExiste) {
      return falha('nome_duplicado');
    }
    this.proximoId += 1;
    const criado = produtoFalso({
      id: `novo-${this.proximoId}`,
      casaId,
      nome: dados.nome,
      categoria: dados.categoria,
      unidade: dados.unidade,
      quantidadeAtual: dados.quantidadeAtual,
      quantidadeNecessaria: dados.quantidadeNecessaria,
      valorUnitario: dados.valorUnitario,
    });
    this.produtos.push(criado);
    return sucesso(criado);
  }

  async editar(
    id: string,
    dados: Partial<Omit<ProdutoValidado, 'quantidadeAtual'>>,
  ): Promise<Result<Produto, ErroEscritaProduto>> {
    const indice = this.produtos.findIndex((p) => p.id === id && p.deletadoEm === null);
    if (indice === -1) {
      return falha('nao_encontrado');
    }
    const atualizado = { ...this.produtos[indice], ...dados };
    this.produtos[indice] = atualizado;
    return sucesso(atualizado);
  }

  async removerLogicamente(id: string): Promise<void> {
    const indice = this.produtos.findIndex((p) => p.id === id);
    if (indice !== -1) {
      this.produtos[indice] = { ...this.produtos[indice], deletadoEm: 1 };
    }
  }

  async listarDespensa(casaId: string): Promise<Produto[]> {
    return this.produtos.filter(
      (p) => p.casaId === casaId && p.ativo && p.deletadoEm === null,
    );
  }

  async listarFaltantes(): Promise<FaltanteBruto[]> {
    return [];
  }

  async buscarPorNome(casaId: string, termo: string): Promise<Produto[]> {
    return (await this.listarDespensa(casaId)).filter((p) =>
      p.nome.toLowerCase().includes(termo.toLowerCase()),
    );
  }

  async listarCategorias(casaId: string): Promise<string[]> {
    const nomes = (await this.listarDespensa(casaId))
      .map((p) => p.categoria)
      .filter((c): c is string => c !== null);
    return [...new Set(nomes)].sort();
  }

  async obterPorId(id: string): Promise<Produto | null> {
    return this.produtos.find((p) => p.id === id) ?? null;
  }

  /** Registro de cada movimento, para os testes de desfazer. */
  movimentos: { id: string; produtoId: string; tipo: 'baixa' | 'reposicao'; delta: number }[] =
    [];

  private aplicar(
    comando: ComandoBaixa,
    tipo: 'baixa' | 'reposicao',
  ): Result<ResultadoBaixa, 'nao_encontrado'> {
    const indice = this.produtos.findIndex(
      (p) => p.id === comando.produtoId && p.deletadoEm === null,
    );
    if (indice === -1) {
      return falha('nao_encontrado');
    }
    const atual = this.produtos[indice].quantidadeAtual;
    if (tipo === 'baixa' && atual <= 0) {
      return sucesso({ gravou: false, motivo: 'estoque_zerado' });
    }
    const saldo =
      tipo === 'baixa' ? Math.max(0, atual - comando.quantidade) : atual + comando.quantidade;
    this.produtos[indice] = {
      ...this.produtos[indice],
      quantidadeAtual: milesimos(saldo),
      syncStatus: 'pendente',
    };
    this.proximoId += 1;
    const id = `mov-${this.proximoId}`;
    this.movimentos.push({ id, produtoId: comando.produtoId, tipo, delta: saldo - atual });
    return sucesso({ gravou: true, saldoResultante: milesimos(saldo), movimentoId: id });
  }

  async darBaixa(comando: ComandoBaixa): Promise<Result<ResultadoBaixa, 'nao_encontrado'>> {
    return this.aplicar(comando, 'baixa');
  }

  async repor(comando: ComandoBaixa): Promise<Result<ResultadoBaixa, 'nao_encontrado'>> {
    return this.aplicar(comando, 'reposicao');
  }

  async adotarListaBase(casaId: string, itens: ItemListaBase[]): Promise<Produto[]> {
    const criados = itens.map((item, indice) =>
      produtoFalso({
        id: `base-${indice}`,
        casaId,
        nome: item.nome,
        categoria: item.categoria,
        unidade: item.unidade,
        quantidadeAtual: milesimos(0),
        quantidadeNecessaria: item.quantidadeNecessaria,
        valorUnitario: centavos(0),
      }),
    );
    this.produtos.push(...criados);
    return criados;
  }
}

/** Espelha o append-only do real: desfazer insere o inverso, nunca apaga. */
export class MovimentoRepositorioFalso implements MovimentoRepository {
  constructor(private readonly produtos: ProdutoRepositorioFalso) {}

  async historicoPorProduto(): Promise<never[]> {
    return [];
  }

  async historicoPorCasa(): Promise<never[]> {
    return [];
  }

  async desfazer(
    movimentoOriginalId: string,
  ): Promise<Result<{ movimentoInversoId: string; saldoResultante: Milesimos }, 'nao_encontrado'>> {
    const original = this.produtos.movimentos.find((m) => m.id === movimentoOriginalId);
    if (!original) {
      return falha('nao_encontrado');
    }
    const indice = this.produtos.produtos.findIndex((p) => p.id === original.produtoId);
    const atual = this.produtos.produtos[indice].quantidadeAtual;
    const saldo = milesimos(Math.max(0, atual - original.delta));
    this.produtos.produtos[indice] = {
      ...this.produtos.produtos[indice],
      quantidadeAtual: saldo,
    };
    const inversoId = `${movimentoOriginalId}-inverso`;
    this.produtos.movimentos.push({
      id: inversoId,
      produtoId: original.produtoId,
      tipo: original.tipo === 'baixa' ? 'reposicao' : 'baixa',
      delta: -original.delta,
    });
    return sucesso({ movimentoInversoId: inversoId, saldoResultante: saldo });
  }

  async reconciliar(): Promise<never[]> {
    return [];
  }
}

export class ObservadorFalso implements ObservadorDeMudancas {
  private ouvintes = new Set<() => void>();

  assinar(ouvinte: () => void): () => void {
    this.ouvintes.add(ouvinte);
    return () => this.ouvintes.delete(ouvinte);
  }

  notificar(): void {
    for (const ouvinte of this.ouvintes) {
      ouvinte();
    }
  }
}
