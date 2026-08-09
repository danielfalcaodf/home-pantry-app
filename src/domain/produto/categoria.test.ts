import { normalizarCategoria } from './categoria';

describe('normalizarCategoria', () => {
  it('remove espaços nas pontas', () => {
    expect(normalizarCategoria(' Limpeza ')).toBe('Limpeza');
  });

  it('capitaliza a primeira letra', () => {
    expect(normalizarCategoria('limpeza')).toBe('Limpeza');
  });

  it('colapsa espaços internos repetidos', () => {
    expect(normalizarCategoria('Produtos  de   limpeza')).toBe('Produtos de limpeza');
  });

  it('texto só de espaços vira ausência de categoria, não string vazia', () => {
    expect(normalizarCategoria('   ')).toBeNull();
    expect(normalizarCategoria('')).toBeNull();
  });
});
