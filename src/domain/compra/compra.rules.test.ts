import { Produto } from '../produto/produto';
import { centavos } from '../shared/dinheiro';
import { milesimos } from '../shared/quantidade';
import { Compra, CompraItem } from './compra';
import {
  completarMesesSemCompra,
  dataDeReferencia,
  divergenciaDePreco,
  efeitoDeReposicao,
  efeitosDaFinalizacao,
  GastoDoMes,
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
    atualizarPreco: null,
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

  it('preço herdado do produto pelo fluxo de marcar() entra no total normalmente (correção-total-compra-preco-heranca)', () => {
    // valorPagoUnitario já vem preenchido com o valorEstimadoUnit — marcar()
    // grava o herdado, totalPago() não precisa saber que ele é herdado.
    const itens = [comprado('p1', 2000, 890)];
    expect(totalPago(itens)).toBe(1780);
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

function gasto(mes: string, totalPago = 0, qtdCompras = 1): GastoDoMes {
  return { mes, totalPago: centavos(totalPago), qtdCompras };
}

function compra(sobrescreve: Partial<Compra> = {}): Compra {
  return {
    id: 'compra-1',
    casaId: 'casa-1',
    usuarioId: 'usuario-1',
    status: 'finalizada',
    valorTotalPago: centavos(1000),
    criadaEm: 0,
    finalizadaEm: 500,
    atualizadoEm: 500,
    syncStatus: 'local',
    ...sobrescreve,
  };
}

describe('dataDeReferencia', () => {
  it('usa finalizadaEm quando presente', () => {
    expect(dataDeReferencia(compra({ finalizadaEm: 500, atualizadoEm: 999 }))).toBe(500);
  });

  it('usa atualizadoEm quando finalizadaEm é null (compra cancelada)', () => {
    expect(dataDeReferencia(compra({ status: 'cancelada', finalizadaEm: null, atualizadoEm: 999 }))).toBe(
      999,
    );
  });
});

describe('completarMesesSemCompra', () => {
  it('preenche os doze meses do mais recente ao mais antigo', () => {
    const meses = completarMesesSemCompra([], '2026-08');
    expect(meses).toHaveLength(12);
    expect(meses.map((m) => m.mes)).toEqual([
      '2026-08',
      '2026-07',
      '2026-06',
      '2026-05',
      '2026-04',
      '2026-03',
      '2026-02',
      '2026-01',
      '2025-12',
      '2025-11',
      '2025-10',
      '2025-09',
    ]);
  });

  it('mês sem compra vem com total e contagem zerados', () => {
    const meses = completarMesesSemCompra([], '2026-08');
    expect(meses[0]).toEqual({ mes: '2026-08', totalPago: 0, qtdCompras: 0 });
  });

  it('mês com dados reais preserva o total e a contagem da consulta', () => {
    const meses = completarMesesSemCompra([gasto('2026-08', 18940, 3)], '2026-08');
    expect(meses[0]).toEqual({ mes: '2026-08', totalPago: 18940, qtdCompras: 3 });
  });

  it('atravessa a virada do ano sem pular ou repetir mês', () => {
    const meses = completarMesesSemCompra([], '2026-01');
    expect(meses.map((m) => m.mes)).toEqual([
      '2026-01',
      '2025-12',
      '2025-11',
      '2025-10',
      '2025-09',
      '2025-08',
      '2025-07',
      '2025-06',
      '2025-05',
      '2025-04',
      '2025-03',
      '2025-02',
    ]);
  });

  it('meses fora da consulta (fora da janela de doze meses) não aparecem', () => {
    const meses = completarMesesSemCompra([gasto('2024-01', 500)], '2026-08');
    expect(meses.find((m) => m.mes === '2024-01')).toBeUndefined();
  });
});
