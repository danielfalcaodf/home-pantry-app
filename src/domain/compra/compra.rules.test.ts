import { Produto } from '../produto/produto';
import { centavos } from '../shared/dinheiro';
import { milesimos } from '../shared/quantidade';
import { CompraItem } from './compra';
import {
  divergenciaDePreco,
  efeitoDeReposicao,
  efeitosDaFinalizacao,
  totalPago,
} from './compra.rules';

let sequencia = 0;

function item(sobrescreve: Partial<CompraItem> = {}): CompraItem {
  sequencia += 1;
  return {
    id: `item-${sequencia}`,
    compraId: 'compra-1',
    produtoId: null,
    nomeAvulso: 'Avulso',
    unidade: 'un',
    quantidadePlanejada: milesimos(1000),
    quantidadeComprada: null,
    valorEstimadoUnit: centavos(0),
    valorPagoUnitario: null,
    comprado: false,
    ordem: 0,
    excluido: false,
    ...sobrescreve,
  };
}

function produto(sobrescreve: Partial<Produto> = {}): Produto {
  sequencia += 1;
  return {
    id: `produto-${sequencia}`,
    casaId: 'casa-1',
    nome: 'Arroz',
    categoria: null,
    unidade: 'un',
    quantidadeAtual: milesimos(0),
    quantidadeNecessaria: milesimos(2000),
    valorUnitario: centavos(0),
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

function comprado(
  produtoId: string | null,
  quantidade: number,
  precoPago: number | null,
): CompraItem {
  return item({
    produtoId,
    nomeAvulso: produtoId === null ? 'Avulso' : null,
    comprado: true,
    quantidadeComprada: milesimos(quantidade),
    valorPagoUnitario: precoPago === null ? null : centavos(precoPago),
  });
}

describe('totalPago', () => {
  it('soma apenas itens marcados: 2000×890 + 1000×2250 = 4030', () => {
    const itens = [comprado('p1', 2000, 890), comprado('p2', 1000, 2250)];
    expect(totalPago(itens)).toBe(4030);
  });

  it('item não marcado é ignorado', () => {
    const itens = [
      comprado('p1', 2000, 890),
      item({ produtoId: 'p2', comprado: false, valorPagoUnitario: centavos(9999) }),
    ];
    expect(totalPago(itens)).toBe(1780);
  });

  it('compra sem itens marcados soma zero', () => {
    expect(totalPago([item(), item()])).toBe(0);
  });

  it('item marcado sem preço contribui com zero sem invalidar o cálculo', () => {
    const itens = [comprado('p1', 2000, null), comprado('p2', 1000, 500)];
    expect(totalPago(itens)).toBe(500);
  });
});

describe('efeitoDeReposicao', () => {
  it('soma a quantidade comprada ao estoque e gera movimento de reposição', () => {
    const p = produto({ quantidadeAtual: milesimos(500) });
    const efeito = efeitoDeReposicao(comprado(p.id, 2000, null), p);
    expect(efeito).toEqual({
      produtoId: p.id,
      novaQuantidade: 2500,
      movimento: { tipo: 'reposicao', variacao: 2000 },
    });
  });

  it('item avulso não gera efeito nem movimento', () => {
    expect(efeitoDeReposicao(comprado(null, 2000, 100), undefined)).toBeNull();
  });

  it('usa a quantidade comprada, não a planejada', () => {
    const p = produto();
    const itemComprado = item({
      produtoId: p.id,
      nomeAvulso: null,
      comprado: true,
      quantidadePlanejada: milesimos(3000),
      quantidadeComprada: milesimos(2000),
    });
    expect(efeitoDeReposicao(itemComprado, p)?.movimento.variacao).toBe(2000);
  });
});

describe('divergenciaDePreco', () => {
  it('sinaliza quando o pago difere do cadastrado', () => {
    const p = produto({ valorUnitario: centavos(890) });
    expect(divergenciaDePreco(comprado(p.id, 1000, 950), p)).toBe(true);
  });

  it('não sinaliza quando o pago é igual ao cadastrado', () => {
    const p = produto({ valorUnitario: centavos(890) });
    expect(divergenciaDePreco(comprado(p.id, 1000, 890), p)).toBe(false);
  });

  it('produto sem preço cadastrado e pago maior que zero sinaliza divergência', () => {
    const p = produto({ valorUnitario: centavos(0) });
    expect(divergenciaDePreco(comprado(p.id, 1000, 950), p)).toBe(true);
  });

  it('item sem preço pago não sinaliza', () => {
    const p = produto({ valorUnitario: centavos(890) });
    expect(divergenciaDePreco(comprado(p.id, 1000, null), p)).toBe(false);
  });
});

describe('efeitosDaFinalizacao', () => {
  it('calcula reposições, atualizações confirmadas e total em uma única estrutura', () => {
    const p1 = produto({ quantidadeAtual: milesimos(500), valorUnitario: centavos(890) });
    const p2 = produto({ quantidadeAtual: milesimos(0), valorUnitario: centavos(2250) });
    const itens = [
      comprado(p1.id, 2000, 950), // divergente, confirmado
      comprado(p2.id, 1000, 2250), // sem divergência
      comprado(null, 500, 300), // avulso
    ];
    const resultado = efeitosDaFinalizacao(itens, [p1, p2], new Set([p1.id]));
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor.reposicoes).toHaveLength(2);
      expect(resultado.valor.atualizacoesDePreco).toEqual([
        { produtoId: p1.id, novoValorUnitario: 950 },
      ]);
      expect(resultado.valor.totalPago).toBe(
        Math.round((2000 * 950) / 1000) + Math.round((1000 * 2250) / 1000) + Math.round((500 * 300) / 1000),
      );
    }
  });

  it('sem confirmação a divergência não vira atualização de preço', () => {
    const p = produto({ valorUnitario: centavos(890) });
    const resultado = efeitosDaFinalizacao([comprado(p.id, 1000, 950)], [p], new Set());
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor.atualizacoesDePreco).toEqual([]);
    }
  });

  it('item marcado sem quantidade comprada produz falha sem nenhum efeito', () => {
    const p = produto();
    const invalido = item({ produtoId: p.id, nomeAvulso: null, comprado: true });
    const valido = comprado(p.id, 1000, 100);
    const resultado = efeitosDaFinalizacao([valido, invalido], [p], new Set());
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro).toEqual({
        motivo: 'quantidade_comprada_ausente',
        itemId: invalido.id,
      });
    }
  });
});
