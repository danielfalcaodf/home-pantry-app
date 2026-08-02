import { resolverTema } from './resolver';

describe('resolverTema', () => {
  it('automático segue a aparência do sistema', () => {
    expect(resolverTema('automatico', 'dark')).toBe('despensa');
    expect(resolverTema('automatico', 'light')).toBe('porcelana');
  });

  it('automático sem aparência resolvida cai no claro', () => {
    expect(resolverTema('automatico', null)).toBe('porcelana');
    expect(resolverTema('automatico', undefined)).toBe('porcelana');
    expect(resolverTema('automatico', 'unspecified')).toBe('porcelana');
  });

  it('escolha explícita vence a preferência do sistema', () => {
    expect(resolverTema('claro', 'dark')).toBe('porcelana');
    expect(resolverTema('escuro', 'light')).toBe('despensa');
  });
});
