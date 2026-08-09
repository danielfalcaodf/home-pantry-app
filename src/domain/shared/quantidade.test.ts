import {
  arredondarParaUnidade,
  deDecimal,
  formatarNumero,
  formatarQuantidade,
  milesimos,
  paraDecimal,
} from './quantidade';

describe('conversão decimal ↔ milésimos', () => {
  it('converte 1,5 digitado para 1500 milésimos', () => {
    expect(deDecimal(1.5)).toBe(1500);
  });

  it('converte 1500 milésimos de volta para 1,5', () => {
    expect(paraDecimal(milesimos(1500))).toBe(1.5);
  });

  it('soma milésimos sem erro de arredondamento', () => {
    expect(milesimos(100) + milesimos(200) + milesimos(300)).toBe(600);
  });
});

describe('formatação de quantidade', () => {
  it('exibe 1500 em kg como "1,5 kg"', () => {
    expect(formatarQuantidade(milesimos(1500), 'kg')).toBe('1,5 kg');
  });

  it('não exibe casas decimais supérfluas: 2000 un é "2 un"', () => {
    expect(formatarQuantidade(milesimos(2000), 'un')).toBe('2 un');
  });

  it('pluraliza pacote e caixa', () => {
    expect(formatarQuantidade(milesimos(2000), 'pacote')).toBe('2 pacotes');
    expect(formatarQuantidade(milesimos(1000), 'caixa')).toBe('1 caixa');
  });

  it('formata fração sem zeros à direita', () => {
    expect(formatarNumero(milesimos(500))).toBe('0,5');
    expect(formatarNumero(milesimos(1234))).toBe('1,234');
    expect(formatarNumero(milesimos(1200))).toBe('1,2');
  });
});

describe('arredondamento por unidade', () => {
  it('meio pacote vira um pacote', () => {
    expect(arredondarParaUnidade(milesimos(500), 'pacote')).toBe(1000);
  });

  it('uma unidade e um pouco vira duas unidades', () => {
    expect(arredondarParaUnidade(milesimos(1200), 'un')).toBe(2000);
  });

  it('valor já inteiro não é inflado', () => {
    expect(arredondarParaUnidade(milesimos(2000), 'caixa')).toBe(2000);
  });

  it('unidade divisível preserva a fração', () => {
    expect(arredondarParaUnidade(milesimos(500), 'kg')).toBe(500);
  });

  it('é idempotente: arredondar um valor já arredondado não o altera', () => {
    const primeira = arredondarParaUnidade(milesimos(500), 'pacote');
    const segunda = arredondarParaUnidade(primeira, 'pacote');
    expect(segunda).toBe(primeira);
  });
});
