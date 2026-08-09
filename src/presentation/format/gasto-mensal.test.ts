import { rotuloDoMes } from './gasto-mensal';

describe('rotuloDoMes', () => {
  it('formata "2026-08" como "Agosto de 2026"', () => {
    expect(rotuloDoMes('2026-08')).toBe('Agosto de 2026');
  });

  it('formata janeiro corretamente (índice zero)', () => {
    expect(rotuloDoMes('2026-01')).toBe('Janeiro de 2026');
  });

  it('formata dezembro corretamente (último índice)', () => {
    expect(rotuloDoMes('2025-12')).toBe('Dezembro de 2025');
  });
});
