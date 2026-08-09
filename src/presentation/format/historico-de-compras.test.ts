import { formatarDataDaCompra } from './historico-de-compras';

describe('formatarDataDaCompra', () => {
  it('formata como dd/mm/aaaa', () => {
    expect(formatarDataDaCompra(Date.UTC(2026, 7, 3))).toBe('03/08/2026');
  });
});
