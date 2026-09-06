import { Centavos } from '../shared/dinheiro';
import { Milesimos } from '../shared/quantidade';
import { Unidade } from '../shared/unidade';

export type ItemListaProduto = {
  tipo: 'produto';
  produtoId: string;
  nome: string;
  categoria: string | null;
  unidade: Unidade;
  quantidadeAComprar: Milesimos;
  /** Preço por unidade, como cadastrado no produto — carregado para a
   *  materialização da compra (change modo-compra-e-fechamento, design D2),
   *  que não pode recalcular a partir do custo total. */
  valorUnitario: Centavos;
  custo: Centavos;
  semPreco: boolean;
  /** `null` quando o produto não tem fator de conversão de embalagem cadastrado. */
  pacotes: number | null;
  /**
   * Quantidade final em estoque após a compra, só quando há excedente de
   * pacote a comunicar (spec lista-derivada: "compre 1 pacote (dá para
   * 18)") — `null` quando não há fator ou a compra bate exatamente na
   * necessidade, sem excedente a mencionar.
   */
  quantidadeFinalEstimada: Milesimos | null;
};

export type ItemListaAvulso = {
  tipo: 'avulso';
  itemId: string;
  nome: string;
  categoria: null;
  unidade: Unidade;
  quantidadeAComprar: Milesimos;
  /** Preço por unidade, como cadastrado — evita recalcular a partir do custo ao editar. */
  valorUnitario: Centavos;
  custo: Centavos;
  semPreco: boolean;
};

// União fechada: a apresentação distingue produto de avulso pelo `tipo`,
// nunca checando presença de campo (FRONTEND §12.2 — nada calculado na tela).
export type ItemDaLista = ItemListaProduto | ItemListaAvulso;

export type TotalDaListaDeCompras = {
  total: Centavos;
  contagemItens: number;
  contagemSemPreco: number;
};

// Forma dos valores crus vindos do formulário (SheetAvulso), antes da
// conversão para milésimos/centavos — a conversão é responsabilidade dos
// hooks de aplicação, nunca do componente.
export type DadosDoAvulso = {
  nome: string;
  unidade: Unidade;
  quantidade: number;
  preco: number | null;
};
