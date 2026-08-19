import { Centavos, centavos, multiplicarQuantidadePorPreco } from '../shared/dinheiro';
import {
  arredondarParaUnidade,
  formatarNumero,
  Milesimos,
  milesimos,
} from '../shared/quantidade';
import { Unidade } from '../shared/unidade';

export type EstadoItem = 'critico' | 'emFalta' | 'ok';

type DadosDeEstoque = {
  unidade: Unidade;
  quantidadeAtual: Milesimos;
  quantidadeNecessaria: Milesimos;
  valorUnitario: Centavos;
};

export function estadoDoItem(
  produto: Pick<DadosDeEstoque, 'quantidadeAtual' | 'quantidadeNecessaria'>,
): EstadoItem {
  if (produto.quantidadeAtual <= 0) {
    return 'critico';
  }
  if (produto.quantidadeAtual < produto.quantidadeNecessaria) {
    return 'emFalta';
  }
  return 'ok';
}

export function emFalta(
  produto: Pick<DadosDeEstoque, 'quantidadeAtual' | 'quantidadeNecessaria'>,
): boolean {
  return produto.quantidadeAtual < produto.quantidadeNecessaria;
}

export function quantidadeAComprar(
  produto: Pick<DadosDeEstoque, 'unidade' | 'quantidadeAtual' | 'quantidadeNecessaria'>,
): Milesimos {
  const falta = Math.max(produto.quantidadeNecessaria - produto.quantidadeAtual, 0);
  return arredondarParaUnidade(milesimos(falta), produto.unidade);
}

export type CustoReposicao = { custo: Centavos; semPreco: boolean };

export function custoReposicao(produto: DadosDeEstoque): CustoReposicao {
  if (produto.valorUnitario <= 0) {
    return { custo: centavos(0), semPreco: true };
  }
  return {
    custo: multiplicarQuantidadePorPreco(quantidadeAComprar(produto), produto.valorUnitario),
    semPreco: false,
  };
}

export function valorEmEstoque(
  produto: Pick<DadosDeEstoque, 'quantidadeAtual' | 'valorUnitario'>,
): Centavos {
  return multiplicarQuantidadePorPreco(produto.quantidadeAtual, produto.valorUnitario);
}

export type NivelDoItem = { fracao: number; temSobra: boolean };

// Chamada em loop de renderização: necessária inválida retorna 0, nunca lança.
// A fração vem clampada daqui — a apresentação não calcula nem limita (FRONTEND §12.2).
export function alturaDoNivel(
  produto: Pick<DadosDeEstoque, 'quantidadeAtual' | 'quantidadeNecessaria'>,
): NivelDoItem {
  if (produto.quantidadeNecessaria <= 0) {
    return { fracao: 0, temSobra: false };
  }
  if (produto.quantidadeAtual <= 0) {
    return { fracao: 0, temSobra: false };
  }
  const bruta = produto.quantidadeAtual / produto.quantidadeNecessaria;
  return { fracao: Math.min(bruta, 1), temSobra: bruta > 1 };
}

// Vocabulário de interface (FRONTEND §11): nunca "dar baixa", "movimento", "reposição".
export function rotuloDoItem(
  produto: Pick<DadosDeEstoque, 'unidade' | 'quantidadeAtual' | 'quantidadeNecessaria'>,
): string {
  const estado = estadoDoItem(produto);
  if (estado === 'critico') {
    return 'Acabou';
  }
  if (estado === 'emFalta') {
    return `Falta ${formatarNumero(quantidadeAComprar(produto))}`;
  }
  return 'Cheio';
}

// Passo do stepper de usar/repor rápido. Grama e ml: 25% da quantidade
// necessária (1 unidade fixa é grande demais nesses casos — ex. 500g de
// queijo levaria 500 toques). Kg e L: completa a fração que falta até bater
// a necessária (ex. necessário 1,5kg com 1kg no estoque soma 0,5kg, não
// pula pra 2kg); sem fração faltando (já cheio), 1 unidade por toque — a
// necessária não é embalagem padrão (quem precisa de 9kg pode comprar 3kg
// numa ida e 1kg noutra, não faz sentido repor sempre os 9kg de uma vez).
// Ajuste de quantidade exata cheio/sobrando é sempre pelo teclado (toque
// longo), não por um palpite do toque rápido.
export function passoDoStepper(
  produto: Pick<DadosDeEstoque, 'unidade' | 'quantidadeAtual' | 'quantidadeNecessaria'>,
): Milesimos {
  if (produto.unidade === 'g' || produto.unidade === 'ml') {
    const passo = Math.round(produto.quantidadeNecessaria * 0.25);
    return milesimos(passo > 0 ? passo : 1000);
  }
  if (produto.unidade === 'kg' || produto.unidade === 'L') {
    const falta = produto.quantidadeNecessaria - produto.quantidadeAtual;
    if (falta > 0 && falta < 1000) {
      return milesimos(falta);
    }
  }
  return milesimos(1000);
}

export type TotalDaLista = { total: Centavos; itensSemPreco: number };

export function totalDaLista(produtos: readonly DadosDeEstoque[]): TotalDaLista {
  let total = 0;
  let itensSemPreco = 0;
  for (const produto of produtos) {
    const { custo, semPreco } = custoReposicao(produto);
    if (semPreco) {
      itensSemPreco += 1;
    } else {
      total += custo;
    }
  }
  return { total: centavos(total), itensSemPreco };
}
