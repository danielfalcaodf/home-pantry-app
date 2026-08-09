import { milesimos } from '../../domain/shared/quantidade';
import { descreverMovimento, formatarDataDoMovimento } from './historico-do-movimento';

describe('descreverMovimento', () => {
  it('baixa usa o verbo Usei com a quantidade positiva', () => {
    const descricao = descreverMovimento(
      { tipo: 'baixa', quantidadeDelta: milesimos(-500), quantidadeResultante: milesimos(1000), compraId: null },
      'kg',
    );
    expect(descricao).toEqual({ verbo: 'Usei', quantidade: '0,5 kg' });
  });

  it('reposição sem compra usa o verbo Repus', () => {
    const descricao = descreverMovimento(
      { tipo: 'reposicao', quantidadeDelta: milesimos(2000), quantidadeResultante: milesimos(3000), compraId: null },
      'pacote',
    );
    expect(descricao).toEqual({ verbo: 'Repus', quantidade: '2 pacotes' });
  });

  it('reposição vinda de compra usa o verbo Comprei (task 5.4)', () => {
    const descricao = descreverMovimento(
      { tipo: 'reposicao', quantidadeDelta: milesimos(2000), quantidadeResultante: milesimos(3000), compraId: 'compra-1' },
      'pacote',
    );
    expect(descricao.verbo).toBe('Comprei');
  });

  it('ajuste descreve pelo valor final, não pela variação', () => {
    const descricao = descreverMovimento(
      { tipo: 'ajuste', quantidadeDelta: milesimos(-999), quantidadeResultante: milesimos(0), compraId: null },
      'un',
    );
    expect(descricao).toEqual({ verbo: 'Corrigi para', quantidade: '0 un' });
  });

  it('nenhum verbo usa jargão de sistema', () => {
    for (const tipo of ['baixa', 'reposicao', 'ajuste'] as const) {
      const descricao = descreverMovimento(
        { tipo, quantidadeDelta: milesimos(1000), quantidadeResultante: milesimos(1000), compraId: null },
        'un',
      );
      expect(descricao.verbo).not.toMatch(/dar baixa|movimento de estoque|reposição/i);
    }
  });
});

describe('formatarDataDoMovimento', () => {
  it('formata data e hora em pt-BR', () => {
    const texto = formatarDataDoMovimento(new Date('2026-01-15T14:30:00').getTime());
    expect(texto).toMatch(/15\/01\/2026 às 14:30/);
  });
});
