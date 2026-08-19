import { render, screen } from '@testing-library/react-native';
import { ReactTestRendererJSON } from 'react-test-renderer';

import { espaco } from '../theme/espaco';
import { ThemeProvider } from '../theme/provider';
import { GraficoBarras } from './grafico-barras';

async function comTema(dados: { chave: string; rotulo: string; valor: number }[]) {
  await render(
    <ThemeProvider preferencia="escuro">
      <GraficoBarras dados={dados} altura={100} />
    </ThemeProvider>,
  );
}

function achatarViews(no: ReactTestRendererJSON | null): ReactTestRendererJSON[] {
  if (!no) {
    return [];
  }
  const filhos = Array.isArray(no.children)
    ? no.children.flatMap((filho) =>
        typeof filho === 'string' ? [] : achatarViews(filho as ReactTestRendererJSON),
      )
    : [];
  return no.type === 'View' ? [no, ...filhos] : filhos;
}

/** Só as `View` da própria barra têm `width: '100%'` — o container e o
 *  invólucro de cada coluna não, o que evita confundir a altura do
 *  container (`height: altura`) com a altura da barra. */
function alturasDasBarras(no: ReactTestRendererJSON): number[] {
  return achatarViews(no)
    .map((view) => {
      const bruto = view.props.style;
      const lista = Array.isArray(bruto) ? bruto.flat(Infinity) : [bruto];
      return Object.assign({}, ...lista.filter(Boolean));
    })
    .filter((estilo) => estilo.width === '100%')
    .map((estilo) => estilo.height as number);
}

describe('GraficoBarras', () => {
  it('renderiza o rótulo de cada barra', async () => {
    await comTema([
      { chave: '2026-05', rotulo: 'Mai', valor: 1000 },
      { chave: '2026-06', rotulo: 'Jun', valor: 2000 },
      { chave: '2026-07', rotulo: 'Jul', valor: 500 },
      { chave: '2026-08', rotulo: 'Ago', valor: 0 },
    ]);
    expect(screen.getByText('Mai')).toBeTruthy();
    expect(screen.getByText('Jun')).toBeTruthy();
    expect(screen.getByText('Jul')).toBeTruthy();
    expect(screen.getByText('Ago')).toBeTruthy();
  });

  it('altura da barra é proporcional ao maior valor do período, dentro da área útil com clearance', async () => {
    const resultado = await render(
      <ThemeProvider preferencia="escuro">
        <GraficoBarras
          altura={100}
          dados={[
            { chave: 'a', rotulo: 'A', valor: 50 },
            { chave: 'b', rotulo: 'B', valor: 100 },
          ]}
        />
      </ThemeProvider>,
    );
    const alturas = alturasDasBarras(resultado.toJSON() as ReactTestRendererJSON);
    const alturaUtil = 100 - espaco.sm;
    // A barra do maior valor (100) preenche a área útil (com clearance reservada); a menor (50) é metade dela.
    expect(Math.max(...alturas)).toBe(alturaUtil);
    expect(alturas).toContain(alturaUtil / 2);
  });

  // Prova do cenário do bug (correcao-grafico-cobre-ver-historico, task 2.1):
  // um único mês com gasto (fração 1) não pode ocupar a altura inteira do
  // container, senão cobre o cabeçalho "Ver histórico" acima do gráfico.
  it('fração máxima (um único mês com gasto) deixa clearance mínima garantida — não ocupa a altura inteira', async () => {
    const altura = 96;
    const resultado = await render(
      <ThemeProvider preferencia="escuro">
        <GraficoBarras altura={altura} dados={[{ chave: 'a', rotulo: 'Ago', valor: 10000 }]} />
      </ThemeProvider>,
    );
    const [alturaBarra] = alturasDasBarras(resultado.toJSON() as ReactTestRendererJSON);
    expect(alturaBarra).toBeDefined();
    expect(alturaBarra).toBeLessThan(altura);
    expect(altura - alturaBarra).toBeGreaterThanOrEqual(espaco.sm);
  });

  // Task 3.1: fração próxima de 1 (não exatamente 1) — clearance segue garantida.
  it('fração próxima de 1 (mês com gasto muito maior que os demais) ainda mantém clearance', async () => {
    const altura = 96;
    const resultado = await render(
      <ThemeProvider preferencia="escuro">
        <GraficoBarras
          altura={altura}
          dados={[
            { chave: 'a', rotulo: 'Jun', valor: 100 },
            { chave: 'b', rotulo: 'Jul', valor: 9800 },
          ]}
        />
      </ThemeProvider>,
    );
    const alturas = alturasDasBarras(resultado.toJSON() as ReactTestRendererJSON);
    for (const alturaBarra of alturas) {
      expect(alturaBarra).toBeLessThanOrEqual(altura - espaco.sm);
    }
  });

  // Task 3.2: várias barras com frações medianas — leitura proporcional entre
  // elas continua correta, sem regressão do cálculo relativo.
  it('várias barras com frações medianas mantêm a proporção entre si, sem regressão', async () => {
    const altura = 96;
    const alturaUtil = altura - espaco.sm;
    const resultado = await render(
      <ThemeProvider preferencia="escuro">
        <GraficoBarras
          altura={altura}
          dados={[
            { chave: 'a', rotulo: 'Mai', valor: 3000 },
            { chave: 'b', rotulo: 'Jun', valor: 6000 },
            { chave: 'c', rotulo: 'Jul', valor: 4500 },
          ]}
        />
      </ThemeProvider>,
    );
    const alturas = alturasDasBarras(resultado.toJSON() as ReactTestRendererJSON);
    expect(alturas).toEqual([alturaUtil * 0.5, alturaUtil, alturaUtil * 0.75]);
  });

  it('nenhuma barra recebe onPress — o gráfico é só leitura', async () => {
    const resultado = await render(
      <ThemeProvider preferencia="escuro">
        <GraficoBarras altura={100} dados={[{ chave: 'a', rotulo: 'A', valor: 10 }]} />
      </ThemeProvider>,
    );
    const views = achatarViews(resultado.toJSON() as ReactTestRendererJSON);
    expect(views.every((no) => no.props.onPress === undefined)).toBe(true);
    expect(views.every((no) => no.props.onStartShouldSetResponder === undefined)).toBe(true);
  });

  it('sem compras no período (todos zerados), não quebra', async () => {
    await comTema([
      { chave: 'a', rotulo: 'A', valor: 0 },
      { chave: 'b', rotulo: 'B', valor: 0 },
    ]);
    expect(screen.getByText('A')).toBeTruthy();
  });

  it('só o último item (mês mais recente) fica em opacidade plena — os demais em 0.4', async () => {
    const resultado = await render(
      <ThemeProvider preferencia="escuro">
        <GraficoBarras
          altura={100}
          dados={[
            { chave: 'a', rotulo: 'A', valor: 10 },
            { chave: 'b', rotulo: 'B', valor: 20 },
            { chave: 'c', rotulo: 'C', valor: 30 },
          ]}
        />
      </ThemeProvider>,
    );
    const views = achatarViews(resultado.toJSON() as ReactTestRendererJSON);
    const opacidades = views
      .map((no) => no.props.style)
      .flat()
      .map((estilo) => estilo?.opacity)
      .filter((valor): valor is number => typeof valor === 'number');
    expect(opacidades).toEqual([0.4, 0.4, 1]);
  });
});
