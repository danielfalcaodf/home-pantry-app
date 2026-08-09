import { render, screen } from '@testing-library/react-native';
import { ReactTestRendererJSON } from 'react-test-renderer';

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

  it('altura da barra é proporcional ao maior valor do período', async () => {
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
    const views = achatarViews(resultado.toJSON() as ReactTestRendererJSON);
    const alturas = views
      .map((no) => no.props.style)
      .flat()
      .map((estilo) => estilo?.height)
      .filter((valor): valor is number => typeof valor === 'number' && valor > 0);
    // A barra do maior valor (100) preenche a altura cheia; a menor (50) é metade.
    expect(Math.max(...alturas)).toBe(100);
    expect(alturas).toContain(50);
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
