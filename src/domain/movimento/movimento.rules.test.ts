import { milesimos } from '../shared/quantidade';
import {
  aplicarMovimento,
  calcularAjuste,
  construirMovimento,
  movimentoInverso,
} from './movimento.rules';

describe('construirMovimento — coerência de sinal', () => {
  it('baixa com variação negativa é aceita', () => {
    const resultado = construirMovimento('baixa', milesimos(-1000));
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor.variacao).toBe(-1000);
    }
  });

  it('reposição com variação positiva é aceita', () => {
    const resultado = construirMovimento('reposicao', milesimos(2000));
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor.variacao).toBe(2000);
    }
  });

  it('variação zero é rejeitada em qualquer tipo', () => {
    for (const tipo of ['baixa', 'reposicao', 'ajuste'] as const) {
      const resultado = construirMovimento(tipo, milesimos(0));
      expect(resultado.ok).toBe(false);
      if (!resultado.ok) {
        expect(resultado.erro).toBe('variacao_zero');
      }
    }
  });

  it('sinal incoerente é rejeitado: baixa positiva e reposição negativa', () => {
    const baixa = construirMovimento('baixa', milesimos(1000));
    expect(baixa.ok).toBe(false);
    if (!baixa.ok) {
      expect(baixa.erro).toBe('sinal_incoerente');
    }
    const reposicao = construirMovimento('reposicao', milesimos(-1000));
    expect(reposicao.ok).toBe(false);
  });

  it('ajuste aceita qualquer sinal', () => {
    expect(construirMovimento('ajuste', milesimos(300)).ok).toBe(true);
    expect(construirMovimento('ajuste', milesimos(-300)).ok).toBe(true);
  });
});

describe('calcularAjuste — usuário informa o valor final, não a diferença', () => {
  it('ajuste para cima calcula a variação positiva', () => {
    const resultado = calcularAjuste(milesimos(2000), milesimos(5000));
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor).toEqual({ tipo: 'ajuste', variacao: 3000 });
    }
  });

  it('ajuste para baixo calcula a variação negativa', () => {
    const resultado = calcularAjuste(milesimos(5000), milesimos(2000));
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor).toEqual({ tipo: 'ajuste', variacao: -3000 });
    }
  });

  it('ajuste para zero calcula a variação até zero', () => {
    const resultado = calcularAjuste(milesimos(3000), milesimos(0));
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor).toEqual({ tipo: 'ajuste', variacao: -3000 });
    }
  });

  it('valor final igual ao atual não grava — mesmo erro de variação zero', () => {
    const resultado = calcularAjuste(milesimos(2000), milesimos(2000));
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro).toBe('variacao_zero');
    }
  });

  it('valor final negativo é rejeitado', () => {
    const resultado = calcularAjuste(milesimos(2000), milesimos(-1000));
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro).toBe('valor_negativo');
    }
  });

  it('o tipo é sempre ajuste, independentemente do sinal da variação', () => {
    const paraCima = calcularAjuste(milesimos(1000), milesimos(2000));
    const paraBaixo = calcularAjuste(milesimos(2000), milesimos(1000));
    expect(paraCima.ok && paraCima.valor.tipo).toBe('ajuste');
    expect(paraBaixo.ok && paraBaixo.valor.tipo).toBe('ajuste');
  });
});

describe('aplicarMovimento — saldo nunca negativo', () => {
  it('baixa dentro do saldo', () => {
    const aplicado = aplicarMovimento(milesimos(3000), {
      tipo: 'baixa',
      variacao: milesimos(-1000),
    });
    expect(aplicado).toEqual({
      gravar: true,
      saldoResultante: 2000,
      variacaoAplicada: -1000,
    });
  });

  it('baixa que cruzaria zero fixa em zero: saldo 500 com baixa de 2000', () => {
    const aplicado = aplicarMovimento(milesimos(500), {
      tipo: 'baixa',
      variacao: milesimos(-2000),
    });
    expect(aplicado).toEqual({
      gravar: true,
      saldoResultante: 0,
      variacaoAplicada: -500,
    });
  });

  it('baixa em item já zerado sinaliza nada a gravar', () => {
    const aplicado = aplicarMovimento(milesimos(0), {
      tipo: 'baixa',
      variacao: milesimos(-1000),
    });
    expect(aplicado).toEqual({ gravar: false, saldoResultante: 0 });
  });

  it('reposição soma ao saldo', () => {
    const aplicado = aplicarMovimento(milesimos(1000), {
      tipo: 'reposicao',
      variacao: milesimos(2000),
    });
    expect(aplicado).toEqual({
      gravar: true,
      saldoResultante: 3000,
      variacaoAplicada: 2000,
    });
  });
});

describe('movimentoInverso — desfazer é um novo movimento', () => {
  it('inverso de uma baixa é reposição de sinal oposto', () => {
    expect(movimentoInverso({ tipo: 'baixa', quantidadeDelta: milesimos(-1000) })).toEqual({
      tipo: 'reposicao',
      variacao: 1000,
    });
  });

  it('inverso de uma reposição é baixa de sinal oposto', () => {
    expect(
      movimentoInverso({ tipo: 'reposicao', quantidadeDelta: milesimos(2000) }),
    ).toEqual({ tipo: 'baixa', variacao: -2000 });
  });

  it('inverso de um ajuste mantém o tipo ajuste', () => {
    expect(movimentoInverso({ tipo: 'ajuste', quantidadeDelta: milesimos(300) })).toEqual({
      tipo: 'ajuste',
      variacao: -300,
    });
  });

  it('o movimento original não é alterado', () => {
    const original = { tipo: 'baixa' as const, quantidadeDelta: milesimos(-1000) };
    movimentoInverso(original);
    expect(original).toEqual({ tipo: 'baixa', quantidadeDelta: -1000 });
  });
});
