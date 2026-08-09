import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '../theme/provider';
import { BotaoVoltar } from './botao-voltar';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

describe('BotaoVoltar', () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it('renderiza com rótulo acessível "Voltar"', async () => {
    await render(
      <ThemeProvider preferencia="escuro">
        <BotaoVoltar />
      </ThemeProvider>,
    );
    expect(screen.getByLabelText('Voltar')).toBeTruthy();
  });

  it('chama router.back() ao tocar', async () => {
    await render(
      <ThemeProvider preferencia="escuro">
        <BotaoVoltar />
      </ThemeProvider>,
    );
    fireEvent.press(screen.getByLabelText('Voltar'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
