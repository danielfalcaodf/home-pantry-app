import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { ThemeProvider } from '../theme/provider';
import { SheetPrecoProduto } from './sheet-preco-produto';

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('SheetPrecoProduto', () => {
  it('não usa autoFocus na montagem — foco vem do onAberto do PainelInferior (correcao-sheets-ajuste-sem-autofoco)', async () => {
    await comTema(
      <SheetPrecoProduto visivel nome="Arroz" unidade="un" precoInicial={null} onFechar={jest.fn()} onSalvar={jest.fn()} />,
    );

    // `autoFocus` na montagem é a causa raiz do bug de teclado em sheets
    // sobre `Modal` no Android real — ver painel-inferior.test.tsx para a
    // prova de que o foco correto (via `onAberto`) funciona.
    expect(screen.getByLabelText('Quanto costuma custar').props.autoFocus).toBeFalsy();
  });

  it('produto em kg oferece "por kg · por 100 g" e devolve a base escolhida', async () => {
    const onSalvar = jest.fn();
    await comTema(
      <SheetPrecoProduto visivel nome="Queijo" unidade="kg" precoInicial={null} onFechar={jest.fn()} onSalvar={onSalvar} />,
    );

    expect(screen.getByRole('button', { name: 'por kg' }).props.accessibilityState.selected).toBe(true);
    await fireEvent.changeText(screen.getByLabelText('Quanto costuma custar'), '5,19');
    await waitFor(() => expect(screen.getByLabelText('Quanto costuma custar').props.accessibilityValue.text).toBe('R$ 5,19'));
    await fireEvent.press(screen.getByRole('button', { name: 'por 100 g' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSalvar).toHaveBeenCalledWith(5.19, '100g');
  });

  it('produto em un não mostra a escolha de base', async () => {
    await comTema(
      <SheetPrecoProduto visivel nome="Sabonete" unidade="un" precoInicial={null} onFechar={jest.fn()} onSalvar={jest.fn()} />,
    );
    expect(screen.queryByRole('button', { name: 'por 100 g' })).toBeNull();
  });
});
