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
  | { gravou: false; motivo: 'estoque_zerado' };

export type ItemListaBase = {
  nome: string;
  categoria: string;
  unidade: Unidade;
  quantidadeNecessaria: Milesimos;
};

export interface ProdutoRepository {
  criar(casaId: string, dados: ProdutoValidado): Promise<Result<Produto, ErroEscritaProduto>>;
  editar(
    id: string,
    dados: Partial<ProdutoValidado>,
  ): Promise<Result<Produto, ErroEscritaProduto>>;
  removerLogicamente(id: string): Promise<void>;
  listarDespensa(casaId: string): Promise<Produto[]>;
  listarFaltantes(casaId: string): Promise<FaltanteBruto[]>;
  buscarPorNome(casaId: string, termo: string): Promise<Produto[]>;
  listarCategorias(casaId: string): Promise<string[]>;
  obterPorId(id: string): Promise<Produto | null>;
  /** Registro de consumo: UPDATE + INSERT do movimento na MESMA transação. */
  darBaixa(comando: ComandoBaixa): Promise<Result<ResultadoBaixa, 'nao_encontrado'>>;
  /** Adoção da lista base: insere o subconjunto escolhido em uma transação. */
  adotarListaBase(casaId: string, itens: ItemListaBase[]): Promise<Produto[]>;
}
