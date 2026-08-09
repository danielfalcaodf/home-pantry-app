import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { ThemeProvider } from '../theme/provider';
import { SheetAjusteCompra } from './sheet-ajuste-compra';

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('SheetAjusteCompra', () => {
  it('salva a quantidade e o preço digitados, e fecha o painel', async () => {
    const onSalvar = jest.fn();
    const onFechar = jest.fn();
    await comTema(
      <SheetAjusteCompra
        visivel
        nome="Arroz"
        unidade="un"
        quantidadeInicial={2}
        precoInicial={null}
        onFechar={onFechar}
        onSalvar={onSalvar}
      />,
    );

    fireEvent.changeText(screen.getByLabelText(/Quantidade/), '1,5');
    await waitFor(() => expect(screen.getByLabelText(/Quantidade/).props.value).toBe('1,5'));
    fireEvent.changeText(screen.getByLabelText('Preço pago (opcional)'), '9,50');
    await waitFor(() => expect(screen.getByLabelText('Preço pago (opcional)').props.value).toBe('9,50'));
    fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSalvar).toHaveBeenCalledWith({ quantidade: 1.5, preco: 9.5 });
    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it('mantém a quantidade inicial quando o campo fica inválido, e preço nulo quando vazio', async () => {
    const onSalvar = jest.fn();
    await comTema(
      <SheetAjusteCompra
        visivel
        nome="Arroz"
        unidade="un"
        quantidadeInicial={3}
        precoInicial={9.5}
        onFechar={jest.fn()}
        onSalvar={onSalvar}
      />,
    );

    fireEvent.changeText(screen.getByLabelText(/Quantidade/), '0');
    await waitFor(() => expect(screen.getByLabelText(/Quantidade/).props.value).toBe('0'));
    fireEvent.changeText(screen.getByLabelText('Preço pago (opcional)'), '');
    await waitFor(() => expect(screen.getByLabelText('Preço pago (opcional)').props.value).toBe(''));
    fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSalvar).toHaveBeenCalledWith({ quantidade: 3, preco: null });
  });
});
