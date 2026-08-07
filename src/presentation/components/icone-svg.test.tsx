import { render } from '@testing-library/react-native';
import { ReactTestRendererJSON } from 'react-test-renderer';

import { icones } from '../theme/icones';
import { despensa } from '../theme/tokens';
import { IconeSvg } from './icone-svg';

function achatarPaths(no: ReactTestRendererJSON | null): ReactTestRendererJSON[] {
  if (!no) {
    return [];
  }
  const filhos = Array.isArray(no.children)
    ? no.children.flatMap((filho) =>
        typeof filho === 'string' ? [] : achatarPaths(filho as ReactTestRendererJSON),
      )
    : [];
  return no.type === 'RNSVGPath' ? [no, ...filhos] : filhos;
}

describe('IconeSvg', () => {
  it('renderiza um path por item do array recebido', async () => {
    const resultado = await render(
      <IconeSvg path={icones.adicionar} cor={despensa.action.azulejo} />,
    );
    expect(achatarPaths(resultado.toJSON() as ReactTestRendererJSON)).toHaveLength(
      icones.adicionar.length,
    );
  });

  it('aplica a mesma cor recebida a todos os paths, e cores diferentes geram valores diferentes', async () => {
    const azulejo = await render(
      <IconeSvg path={icones.buscar} cor={despensa.state.critico} />,
    );
    const paths = achatarPaths(azulejo.toJSON() as ReactTestRendererJSON);
    expect(paths.length).toBeGreaterThan(0);
    const [primeiraCor] = paths.map((elemento) => elemento.props.stroke);
    for (const elemento of paths) {
      expect(elemento.props.stroke).toEqual(primeiraCor);
    }

    const critico = await render(
      <IconeSvg path={icones.buscar} cor={despensa.action.azulejo} />,
    );
    const [outraCor] = achatarPaths(critico.toJSON() as ReactTestRendererJSON).map(
      (elemento) => elemento.props.stroke,
    );
    expect(outraCor).not.toEqual(primeiraCor);
  });
});
