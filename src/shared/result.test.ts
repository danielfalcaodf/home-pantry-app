import { falha, Result, sucesso } from './result';

describe('Result', () => {
  it('sucesso é discriminável e expõe o valor', () => {
    const resultado: Result<number, string> = sucesso(42);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor).toBe(42);
    }
  });

  it('falha é discriminável e expõe o erro tipado', () => {
    const resultado: Result<number, string> = falha('nome duplicado');
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro).toBe('nome duplicado');
    }
  });

  it('não lança exceção ao construir uma falha', () => {
    expect(() => falha(new Error('validação'))).not.toThrow();
  });
});
