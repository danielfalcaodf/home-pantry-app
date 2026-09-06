import { falha, Result, sucesso } from '../../shared/result';
import { normalizarCategoria } from './categoria';
import { FatorConversao, validarFatorConversao, valorUnitarioDoPacote } from './conversao-embalagem.rules';
import { Centavos, centavos } from '../shared/dinheiro';
import { deDecimal, Milesimos } from '../shared/quantidade';
import { ehUnidade, Unidade } from '../shared/unidade';

export type EntradaCadastroProduto = {
  nome: string;
  unidade: string;
  quantidadeNecessaria: number;
  quantidadeAtual?: number;
  valorUnitario?: number;
  categoria?: string;
  marcaPreferida?: string;
  observacao?: string;
  /** Quantas unidades vêm no pacote — só vale para unidade indivisível. */
  fatorConversaoEmbalagem?: number;
  /** Reais: valor de referência do pacote fechado. */
  valorReferenciaEmbalagem?: number;
};

export type ProdutoValidado = {
  nome: string;
  unidade: Unidade;
  quantidadeNecessaria: Milesimos;
  quantidadeAtual: Milesimos;
  valorUnitario: Centavos;
  categoria: string | null;
  marcaPreferida: string | null;
  observacao: string | null;
  fatorConversaoEmbalagem: FatorConversao | null;
  valorReferenciaEmbalagem: Centavos | null;
};

export type ErroValidacaoProduto = {
  campo:
    | 'nome'
    | 'unidade'
    | 'quantidadeNecessaria'
    | 'valorUnitario'
    | 'quantidadeAtual'
    | 'fatorConversaoEmbalagem';
  mensagem: string;
};

export function validarCadastroProduto(
  entrada: EntradaCadastroProduto,
): Result<ProdutoValidado, ErroValidacaoProduto> {
  const nome = entrada.nome.trim();
  if (nome === '') {
    return falha({ campo: 'nome', mensagem: 'Dê um nome ao produto' });
  }

  if (!ehUnidade(entrada.unidade)) {
    return falha({ campo: 'unidade', mensagem: 'Escolha uma unidade' });
  }

  if (!(entrada.quantidadeNecessaria > 0)) {
    return falha({
      campo: 'quantidadeNecessaria',
      mensagem: 'Diga quanto você quer ter em casa',
    });
  }

  const quantidadeAtual = entrada.quantidadeAtual ?? 0;
  if (quantidadeAtual < 0) {
    return falha({ campo: 'quantidadeAtual', mensagem: 'Quantidade não pode ser negativa' });
  }

  const valorUnitario = entrada.valorUnitario ?? 0;
  if (valorUnitario < 0) {
    return falha({ campo: 'valorUnitario', mensagem: 'Preço não pode ser negativo' });
  }

  const fatorValidado = validarFatorConversao(entrada.unidade, entrada.fatorConversaoEmbalagem);
  if (!fatorValidado.ok) {
    return falha({ campo: 'fatorConversaoEmbalagem', mensagem: fatorValidado.erro.mensagem });
  }
  const fatorConversaoEmbalagem = fatorValidado.valor;
  const valorReferenciaEmbalagem =
    fatorConversaoEmbalagem === null || entrada.valorReferenciaEmbalagem === undefined
      ? null
      : centavos(Math.max(entrada.valorReferenciaEmbalagem, 0) * 100);

  // Preenchidos os dois campos de embalagem, o valor unitário é sempre
  // derivado — nunca o digitado diretamente (spec cadastro-de-produto).
  const valorUnitarioFinal =
    fatorConversaoEmbalagem !== null && valorReferenciaEmbalagem !== null
      ? valorUnitarioDoPacote(valorReferenciaEmbalagem, fatorConversaoEmbalagem)
      : centavos(valorUnitario);

  return sucesso({
    nome,
    unidade: entrada.unidade,
    quantidadeNecessaria: deDecimal(entrada.quantidadeNecessaria),
    quantidadeAtual: deDecimal(quantidadeAtual),
    valorUnitario: valorUnitarioFinal,
    categoria: entrada.categoria === undefined ? null : normalizarCategoria(entrada.categoria),
    marcaPreferida: entrada.marcaPreferida?.trim() || null,
    observacao: entrada.observacao?.trim() || null,
    fatorConversaoEmbalagem,
    valorReferenciaEmbalagem,
  });
}
