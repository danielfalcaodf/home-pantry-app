import { centavos } from '../shared/dinheiro';
import { milesimos } from '../shared/quantidade';
import { gerarCsvDeProdutos } from './exportar-csv';
import { Produto } from './produto';

function produto(sobrescreve: Partial<Produto> = {}): Produto {
  return {
    id: 'p1',
    casaId: 'casa-1',
    nome: 'Arroz',
    categoria: 'Grãos',
    unidade: 'kg',
    quantidadeAtual: milesimos(1500),
    quantidadeNecessaria: milesimos(3000),
    valorUnitario: centavos(1290),
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

describe('gerarCsvDeProdutos', () => {
  it('gera o cabeçalho mesmo sem produtos', () => {
    expect(gerarCsvDeProdutos([])).toBe(
      'Nome,Categoria,Unidade,Quantidade atual,Quantidade necessária,Valor unitário',
    );
  });

  it('converte quantidades e valores para leitura humana, não unidades internas', () => {
    const csv = gerarCsvDeProdutos([produto()]);
    const linhas = csv.split('\r\n');
    expect(linhas[1]).toBe('Arroz,Grãos,kg,"1,5",3,"R$ 12,90"');
  });

  it('categoria ausente vira campo vazio, não "null"', () => {
    const csv = gerarCsvDeProdutos([produto({ categoria: null })]);
    expect(csv.split('\r\n')[1]).toContain(',,kg,');
  });

  it('escapa campos que contêm vírgula, aspas ou quebra de linha', () => {
    const csv = gerarCsvDeProdutos([produto({ nome: 'Arroz, tipo 1' })]);
    expect(csv.split('\r\n')[1].startsWith('"Arroz, tipo 1",')).toBe(true);
  });

  it('uma linha por produto, na ordem recebida', () => {
    const csv = gerarCsvDeProdutos([produto({ id: 'p1', nome: 'Arroz' }), produto({ id: 'p2', nome: 'Feijão' })]);
    const linhas = csv.split('\r\n');
    expect(linhas).toHaveLength(3);
    expect(linhas[1].startsWith('Arroz,')).toBe(true);
    expect(linhas[2].startsWith('Feijão,')).toBe(true);
  });
});
