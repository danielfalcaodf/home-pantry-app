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
  custo: Centavos;
  semPreco: boolean;
};

export type ItemListaAvulso = {
  tipo: 'avulso';
  itemId: string;
  nome: string;
  categoria: null;
  unidade: Unidade;
  quantidadeAComprar: Milesimos;
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
