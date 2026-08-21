import { render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { ThemeProvider } from '../theme/provider';
import { SheetPrecoProduto } from './sheet-preco-produto';

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('SheetPrecoProduto', () => {
  it('não usa autoFocus na montagem — foco vem do onAberto do PainelInferior (correcao-sheets-ajuste-sem-autofoco)', async () => {
    await comTema(
      <SheetPrecoProduto visivel nome="Arroz" precoInicial={null} onFechar={jest.fn()} onSalvar={jest.fn()} />,
    );

    // `autoFocus` na montagem é a causa raiz do bug de teclado em sheets
    // sobre `Modal` no Android real — ver painel-inferior.test.tsx para a
    // prova de que o foco correto (via `onAberto`) funciona.
    expect(screen.getByLabelText('Quanto costuma custar').props.autoFocus).toBeFalsy();
  });
});
