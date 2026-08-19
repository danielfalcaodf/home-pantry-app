import { fireEvent, render, screen, cleanup } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ThemeProvider } from '../theme/provider';
import { PainelInferior } from './painel-inferior';

afterEach(cleanup);

describe('PainelInferior', () => {
  it('toque no backdrop fecha o painel', async () => {
    const onFechar = jest.fn();
    await render(
      <ThemeProvider preferencia="escuro">
        <PainelInferior visivel onFechar={onFechar}>
          <Text>Conteúdo</Text>
        </PainelInferior>
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByLabelText('Fechar'));

    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it('toque no card não propaga pro backdrop — não fecha o painel', async () => {
    const onFechar = jest.fn();
    await render(
      <ThemeProvider preferencia="escuro">
        <PainelInferior visivel onFechar={onFechar}>
          <Text>Conteúdo</Text>
        </PainelInferior>
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByText('Conteúdo'));

    expect(onFechar).not.toHaveBeenCalled();
  });

  it('conteúdo não é renderizado quando `visivel` é falso', async () => {
    await render(
      <ThemeProvider preferencia="escuro">
        <PainelInferior visivel={false} onFechar={jest.fn()}>
          <Text>Conteúdo</Text>
        </PainelInferior>
      </ThemeProvider>,
    );

    expect(screen.queryByText('Conteúdo')).toBeNull();
  });
});
