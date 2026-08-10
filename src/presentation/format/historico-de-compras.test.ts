import { formatarDataDaCompra } from './historico-de-compras';

describe('formatarDataDaCompra', () => {
  it('formata como dd/mm/aaaa', () => {
    expect(formatarDataDaCompra(new Date(2026, 7, 3).getTime())).toBe('03/08/2026');
  });

  it('formata pelo dia civil local nas viradas de dia', () => {
    expect(formatarDataDaCompra(new Date(2026, 6, 31, 23, 59).getTime())).toBe('31/07/2026');
    expect(formatarDataDaCompra(new Date(2026, 7, 1, 0, 1).getTime())).toBe('01/08/2026');
  });

  it('instante em UTC que cai no dia anterior local formata pelo dia local', () => {
    // Meia-noite UTC de 03/08 é 21:00 de 02/08 em America/Sao_Paulo (TZ fixado
    // em jest.tz.js): a data exibida segue o dia local do usuário, não o UTC.
    expect(formatarDataDaCompra(Date.UTC(2026, 7, 3))).toBe('02/08/2026');
  });
});
