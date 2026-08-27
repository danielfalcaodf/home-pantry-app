import { render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { ThemeProvider } from '../theme/provider';
import { despensa } from '../theme/tokens';
import { icones } from '../theme/icones';
import { Botao } from './botao';
import { IconeSvg } from './icone-svg';

// Testa o contrato Botao → IconeSvg (path/cor recebidos) em vez de inspecionar
// o SVG nativo processado (RNTL 14 não expõe mais consultas UNSAFE por tipo/
// props, e a cor chega processada — não mais como string — nesse nível).
jest.mock('./icone-svg', () => ({ IconeSvg: jest.fn(() => null) }));

const iconeMock = IconeSvg as jest.Mock;

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

function estilos(elemento: { props: { style?: unknown } }): Record<string, unknown> {
  const bruto = elemento.props.style;
  const lista = Array.isArray(bruto) ? bruto.flat(Infinity) : [bruto];
  return Object.assign({}, ...lista.filter(Boolean));
}

beforeEach(() => {
  iconeMock.mockClear();
});

describe('Botao — regressão das variantes existentes (correcao-tela-editar-produto)', () => {
  it('variante primário sem as novas props renderiza igual a antes: fundo de ação, sem ícone', async () => {
    await comTema(<Botao titulo="Adicionar à despensa" onPress={() => {}} />);
    const botao = screen.getByRole('button', { name: 'Adicionar à despensa' });
    expect(estilos(botao).backgroundColor).toBe(despensa.action.azulejo);
    expect(iconeMock).not.toHaveBeenCalled();
    const texto = screen.getByText('Adicionar à despensa');
    expect(estilos(texto).color).toBe(despensa.text.onAction);
  });

  it('variante secundário sem as novas props renderiza igual a antes: fundo neutro, sem ícone', async () => {
    await comTema(<Botao titulo="Repus" variante="secundario" onPress={() => {}} />);
    const botao = screen.getByRole('button', { name: 'Repus' });
    expect(estilos(botao).backgroundColor).toBe(despensa.bg.raised);
    expect(iconeMock).not.toHaveBeenCalled();
    const texto = screen.getByText('Repus');
    expect(estilos(texto).color).toBe(despensa.text.primary);
  });

  it('accessibilityLabel sempre é o título, com ou sem as novas props', async () => {
    await comTema(
      <Botao
        titulo="Tirar da despensa"
        variante="secundario"
        icone="lixeira"
        corDestrutiva={despensa.state.critico}
        onPress={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Tirar da despensa' })).toBeTruthy();
  });
});

describe('Botao — ícone e cor destrutiva (correcao-tela-editar-produto)', () => {
  it('com `icone`, repassa o path correspondente do design system para IconeSvg', async () => {
    await comTema(<Botao titulo="Tirar da despensa" icone="lixeira" onPress={() => {}} />);
    expect(iconeMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: icones.lixeira }),
      undefined,
    );
  });

  it('sem `icone`, não chama IconeSvg', async () => {
    await comTema(<Botao titulo="Salvar" onPress={() => {}} />);
    expect(iconeMock).not.toHaveBeenCalled();
  });

  it('com `corDestrutiva`, usa a cor informada no texto e repassa a mesma cor para IconeSvg', async () => {
    await comTema(
      <Botao
        titulo="Tirar da despensa"
        variante="secundario"
        icone="lixeira"
        corDestrutiva={despensa.state.critico}
        onPress={() => {}}
      />,
    );
    const texto = screen.getByText('Tirar da despensa');
    expect(estilos(texto).color).toBe(despensa.state.critico);
    expect(iconeMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: icones.lixeira, cor: despensa.state.critico }),
      undefined,
    );
  });

  it('sem `corDestrutiva`, o ícone recebe a cor padrão da variante (não fica sem cor)', async () => {
    await comTema(<Botao titulo="Repus" variante="secundario" icone="lixeira" onPress={() => {}} />);
    expect(iconeMock).toHaveBeenCalledWith(
      expect.objectContaining({ cor: despensa.text.primary }),
      undefined,
    );
  });
});
