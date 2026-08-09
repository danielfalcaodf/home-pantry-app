import { gerarId } from './id';

describe('gerarId', () => {
  it('retorna string de 36 caracteres no formato UUID', () => {
    const id = gerarId();
    expect(id).toHaveLength(36);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('tem campo de versão 7', () => {
    const id = gerarId();
    expect(id[14]).toBe('7');
  });

  it('tem variante RFC (bits 10xx)', () => {
    const id = gerarId();
    expect(['8', '9', 'a', 'b']).toContain(id[19]);
  });

  it('ordena lexicograficamente por instante de geração', () => {
    const anterior = gerarId(() => 1_000_000_000_000);
    const posterior = gerarId(() => 1_000_000_000_001);
    expect(anterior < posterior).toBe(true);
  });

  it('codifica o timestamp injetado nos primeiros 48 bits', () => {
    const timestamp = 0x0123456789ab;
    const id = gerarId(() => timestamp);
    expect(id.slice(0, 8) + id.slice(9, 13)).toBe('0123456789ab');
  });

  it('gera identificadores distintos no mesmo instante', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => gerarId(() => 42)));
    expect(ids.size).toBe(1000);
  });
});
