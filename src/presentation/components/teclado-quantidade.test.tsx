import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { ThemeProvider } from '../theme/provider';
import { TecladoQuantidade } from './teclado-quantidade';

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('TecladoQuantidade', () => {
  it('confirmar "Usei" chama onUsei com o valor digitado e fecha', async () => {
    const onUsei = jest.fn();
    const onFechar = jest.fn();
    await comTema(
      <TecladoQuantidade
        visivel
        nomeDoItem="Arroz"
        unidade="kg"
        onFechar={onFechar}
        onUsei={onUsei}
        onRepus={jest.fn()}
      />,
    );

    fireEvent.changeText(screen.getByLabelText('Quantidade'), '1,5');
    await waitFor(() => expect(screen.getByLabelText('Quantidade').props.value).toBe('1,5'));
    fireEvent.press(screen.getByRole('button', { name: 'Usei' }));

    expect(onUsei).toHaveBeenCalledWith(1.5);
    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it('sem quantidade válida, os botões de ação ficam desabilitados', async () => {
    await comTema(
      <TecladoQuantidade
        visivel
        nomeDoItem="Arroz"
        unidade="kg"
        onFechar={jest.fn()}
        onUsei={jest.fn()}
        onRepus={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Usei' }).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Repus' }).props.accessibilityState.disabled).toBe(true);
  });

  it('tem um controle de fechar visível, além do toque fora (affordance)', async () => {
    const onFechar = jest.fn();
    await comTema(
      <TecladoQuantidade
        visivel
        nomeDoItem="Arroz"
        unidade="kg"
        onFechar={onFechar}
        onUsei={jest.fn()}
        onRepus={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));

    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it('o campo em foco e os botões de ação estão dentro do wrapper que evita o teclado (Keyboard Overlap)', async () => {
    await comTema(
      <TecladoQuantidade
        visivel
        nomeDoItem="Arroz"
        unidade="kg"
        onFechar={jest.fn()}
        onUsei={jest.fn()}
        onRepus={jest.fn()}
      />,
    );

    const avoidingView = screen.getByTestId('evita-teclado-quantidade');
    expect(within(avoidingView).getByLabelText('Quantidade')).toBeTruthy();
    expect(within(avoidingView).getByRole('button', { name: 'Usei' })).toBeTruthy();
  });

  it('abre com o campo Quantidade em foco automático (não regredir — ACHADO-3-8)', async () => {
    await comTema(
      <TecladoQuantidade
        visivel
        nomeDoItem="Arroz"
        unidade="kg"
        onFechar={jest.fn()}
        onUsei={jest.fn()}
        onRepus={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Quantidade').props.autoFocus).toBe(true);
  });
});
