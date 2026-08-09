import { formatarBRL } from '../shared/dinheiro';
import { formatarNumero } from '../shared/quantidade';
import { Produto } from './produto';

const CABECALHO = [
  'Nome',
  'Categoria',
  'Unidade',
  'Quantidade atual',
  'Quantidade necessária',
  'Valor unitário',
];

function campoCsv(valor: string): string {
  return /[",\r\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

// Portabilidade de dados (PRD §4.4), não backup (design D7): valores
// convertidos para leitura humana — quem abre a planilha lê "1,5 kg" e
// "R$ 12,90", não milésimos e centavos.
export function gerarCsvDeProdutos(produtos: readonly Produto[]): string {
  const linhas = produtos.map((produto) =>
    [
      produto.nome,
      produto.categoria ?? '',
      produto.unidade,
      formatarNumero(produto.quantidadeAtual),
      formatarNumero(produto.quantidadeNecessaria),
      formatarBRL(produto.valorUnitario),
    ]
      .map(campoCsv)
      .join(','),
  );
  return [CABECALHO.join(','), ...linhas].join('\r\n');
}
