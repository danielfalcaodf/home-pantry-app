import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { ThemeProvider } from '../theme/provider';
import { SheetAjusteEstoque } from './sheet-ajuste-estoque';

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('SheetAjusteEstoque', () => {
  it('escolher, desmarcar e reescolher o motivo antes de salvar', async () => {
    const onSalvar = jest.fn();
    const onFechar = jest.fn();
    await comTema(
      <SheetAjusteEstoque
        visivel
        nome="Arroz"
        unidade="pacote"
        quantidadeAtual={2}
        onFechar={onFechar}
        onSalvar={onSalvar}
      />,
    );

    fireEvent.changeText(screen.getByLabelText(/Quanto você tem agora/), '5');
    await waitFor(() => expect(screen.getByLabelText(/Quanto você tem agora/).props.value).toBe('5'));
    fireEvent.press(screen.getByRole('button', { name: 'Vencimento' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Vencimento' }).props.accessibilityState).toEqual(
        expect.objectContaining({ selected: true }),
      ),
    );
    // Tocar de novo no motivo já selecionado o desmarca.
    fireEvent.press(screen.getByRole('button', { name: 'Vencimento' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Vencimento' }).props.accessibilityState).toEqual(
        expect.objectContaining({ selected: false }),
      ),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Perda' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Perda' }).props.accessibilityState).toEqual(
        expect.objectContaining({ selected: true }),
      ),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Corrigir' }));

    expect(onSalvar).toHaveBeenCalledWith({ valorFinal: 5, motivo: 'perda' });
    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it('motivo é opcional — sem seleção, salva com null', async () => {
    const onSalvar = jest.fn();
    await comTema(
      <SheetAjusteEstoque
        visivel
        nome="Arroz"
        unidade="pacote"
        quantidadeAtual={2}
        onFechar={jest.fn()}
        onSalvar={onSalvar}
      />,
    );

    fireEvent.changeText(screen.getByLabelText(/Quanto você tem agora/), '0');
    await waitFor(() => expect(screen.getByLabelText(/Quanto você tem agora/).props.value).toBe('0'));
    fireEvent.press(screen.getByRole('button', { name: 'Corrigir' }));

    expect(onSalvar).toHaveBeenCalledWith({ valorFinal: 0, motivo: null });
  });

  it('valor negativo é rejeitado com erro em texto, sem chamar onSalvar', async () => {
    const onSalvar = jest.fn();
    await comTema(
      <SheetAjusteEstoque
        visivel
        nome="Arroz"
        unidade="pacote"
        quantidadeAtual={2}
        onFechar={jest.fn()}
        onSalvar={onSalvar}
      />,
    );

    fireEvent.changeText(screen.getByLabelText(/Quanto você tem agora/), '-3');
    await waitFor(() => expect(screen.getByLabelText(/Quanto você tem agora/).props.value).toBe('-3'));
    fireEvent.press(screen.getByRole('button', { name: 'Corrigir' }));

    await waitFor(() => expect(screen.getByText('Não pode ser negativo')).toBeTruthy());
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it('tem um controle de fechar visível, além do toque fora (affordance)', async () => {
    const onFechar = jest.fn();
    await comTema(
      <SheetAjusteEstoque
        visivel
        nome="Arroz"
        unidade="pacote"
        quantidadeAtual={2}
        onFechar={onFechar}
        onSalvar={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));

    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it('o campo em foco e o botão de ação estão dentro do wrapper que evita o teclado (Keyboard Overlap)', async () => {
    await comTema(
      <SheetAjusteEstoque
        visivel
        nome="Arroz"
        unidade="pacote"
        quantidadeAtual={2}
        onFechar={jest.fn()}
        onSalvar={jest.fn()}
      />,
    );

    const avoidingView = screen.getByTestId('evita-teclado-ajuste-estoque');
    expect(within(avoidingView).getByLabelText(/Quanto você tem agora/)).toBeTruthy();
    expect(within(avoidingView).getByRole('button', { name: 'Corrigir' })).toBeTruthy();
  });

  it('abre com o campo "Quanto você tem agora" em foco automático (ACHADO-3-8)', async () => {
    await comTema(
      <SheetAjusteEstoque
        visivel
        nome="Arroz"
        unidade="pacote"
        quantidadeAtual={2}
        onFechar={jest.fn()}
        onSalvar={jest.fn()}
      />,
    );

    expect(screen.getByLabelText(/Quanto você tem agora/).props.autoFocus).toBe(true);
  });
});
