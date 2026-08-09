import { EstadoItem } from '../../domain/produto/estoque.rules';
import { agruparPorCategoria, casaComFiltro, contarPorEstado, ItemAgrupavel } from './agrupar-despensa';

let sequencia = 0;
function item(estado: EstadoItem, categoria: string | null = null): ItemAgrupavel {
  sequencia += 1;
  return { produto: { id: `p${sequencia}`, nome: `Item ${sequencia}`, categoria }, estado };
}

describe('contarPorEstado', () => {
  it('soma crítico e em falta no total de "faltando" (spec tela-despensa)', () => {
    const itens = [
      ...Array.from({ length: 3 }, () => item('critico')),
      ...Array.from({ length: 12 }, () => item('emFalta')),
      item('ok'),
    ];
    expect(contarPorEstado(itens)).toEqual({
      tudo: 16,
      critico: 3,
      emFalta: 12,
      ok: 1,
      faltando: 15,
    });
  });

  it('chips sem itens no estado permanecem com contagem zero', () => {
    const itens = [item('ok'), item('ok')];
    const contagens = contarPorEstado(itens);
    expect(contagens.critico).toBe(0);
    expect(contagens.faltando).toBe(0);
  });
});

describe('casaComFiltro', () => {
  it('"tudo" casa com qualquer estado', () => {
    expect(casaComFiltro('critico', 'tudo')).toBe(true);
    expect(casaComFiltro('ok', 'tudo')).toBe(true);
  });

  it('"faltando" casa com crítico e em falta, mas não com cheio', () => {
    expect(casaComFiltro('critico', 'faltando')).toBe(true);
    expect(casaComFiltro('emFalta', 'faltando')).toBe(true);
    expect(casaComFiltro('ok', 'faltando')).toBe(false);
  });

  it('estados isolados continuam casando só consigo mesmos (rota vinda do Resumo)', () => {
    expect(casaComFiltro('emFalta', 'emFalta')).toBe(true);
    expect(casaComFiltro('critico', 'emFalta')).toBe(false);
    expect(casaComFiltro('ok', 'ok')).toBe(true);
  });
});

describe('agruparPorCategoria', () => {
  it('mantém o agrupamento existente intacto após a mudança de filtro', () => {
    const itens = [item('ok', 'Limpeza'), item('critico', 'Limpeza'), item('emFalta', null)];
    const linhas = agruparPorCategoria(itens);
    expect(linhas.filter((l) => l.tipo === 'cabecalho')).toHaveLength(2);
    expect(linhas.filter((l) => l.tipo === 'item')).toHaveLength(3);
  });
});
