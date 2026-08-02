import { Produto } from '../domain/produto/produto';
import { ProdutoValidado } from '../domain/produto/validacao';
import { Centavos } from '../domain/shared/dinheiro';
import { Milesimos } from '../domain/shared/quantidade';
import { Unidade } from '../domain/shared/unidade';
import { Result } from '../shared/result';

export type ErroEscritaProduto = 'nome_duplicado' | 'nao_encontrado';

// Valores brutos de banco: sem arredondamento e sem conversão de moeda —
// o domínio arredonda e converte (DATABASE §6.2).
export type FaltanteBruto = {
  id: string;
  nome: string;
  categoria: string | null;
  unidade: Unidade;
  valorUnitario: Centavos;
  quantidadeAtual: Milesimos;
  quantidadeNecessaria: Milesimos;
  faltaBruta: Milesimos;
};

export type ComandoBaixa = {
  produtoId: string;
  /** magnitude positiva, em milésimos */
  quantidade: Milesimos;
  usuarioId: string;
  criadoEm: number;
};

export type ResultadoBaixa =
  | { gravou: true; saldoResultante: Milesimos; movimentoId: string }
  /** Baixa sobre saldo já zerado: variação 0 é rejeitada pelo banco e
   *  poluiria a trilha append-only. */
  | { gravou: false; motivo: 'estoque_zerado' };

export type ItemListaBase = {
  nome: string;
  categoria: string;
  unidade: Unidade;
  quantidadeNecessaria: Milesimos;
};

export interface ProdutoRepository {
  /**
   * Cria o produto; quantidade inicial > 0 grava um movimento `ajuste` de
   * estoque inicial na MESMA transação — sem isso a reconciliação
   * (DATABASE §6.6) acusaria divergência em todo produto recém-criado.
   */
  criar(
    casaId: string,
    usuarioId: string,
    dados: ProdutoValidado,
  ): Promise<Result<Produto, ErroEscritaProduto>>;
  /** Quantidade atual NÃO é editável aqui — só muda por movimento. */
  editar(
    id: string,
    dados: Partial<Omit<ProdutoValidado, 'quantidadeAtual'>>,
  ): Promise<Result<Produto, ErroEscritaProduto>>;
  removerLogicamente(id: string): Promise<void>;
  listarDespensa(casaId: string): Promise<Produto[]>;
  listarFaltantes(casaId: string): Promise<FaltanteBruto[]>;
  buscarPorNome(casaId: string, termo: string): Promise<Produto[]>;
  listarCategorias(casaId: string): Promise<string[]>;
  obterPorId(id: string): Promise<Produto | null>;
  /** Registro de consumo: UPDATE + INSERT do movimento na MESMA transação. */
  darBaixa(comando: ComandoBaixa): Promise<Result<ResultadoBaixa, 'nao_encontrado'>>;
  /** Reposição sem compra associada, na mesma transação única. */
  repor(comando: ComandoBaixa): Promise<Result<ResultadoBaixa, 'nao_encontrado'>>;
  /** Adoção da lista base: insere o subconjunto escolhido em uma transação. */
  adotarListaBase(casaId: string, itens: ItemListaBase[]): Promise<Produto[]>;
}
