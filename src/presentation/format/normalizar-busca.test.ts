import { casaComBusca, normalizarParaBusca } from './normalizar-busca';

describe('normalizarParaBusca (ACHADO-023)', () => {
  it('remove acento e caixa', () => {
    expect(normalizarParaBusca('Açúcar')).toBe('acucar');
  });

  it('texto já normalizado permanece igual', () => {
    expect(normalizarParaBusca('acucar')).toBe('acucar');
  });
});

describe('casaComBusca (ACHADO-023)', () => {
  it('ignora acento e caixa: "Açúcar" casa com "acucar"', () => {
    expect(casaComBusca('Açúcar', 'acucar')).toBe(true);
  });

  it('termo de busca vazio casa com tudo', () => {
    expect(casaComBusca('Açúcar', '')).toBe(true);
    expect(casaComBusca('Qualquer coisa', '')).toBe(true);
  });

  it('texto já normalizado (sem acento, minúsculo) continua casando', () => {
    expect(casaComBusca('acucar', 'acucar')).toBe(true);
  });

  it('não casa quando o termo não aparece no nome', () => {
    expect(casaComBusca('Açúcar', 'arroz')).toBe(false);
  });
});
