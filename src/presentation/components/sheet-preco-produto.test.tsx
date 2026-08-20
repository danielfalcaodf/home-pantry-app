import { render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { ThemeProvider } from '../theme/provider';
import { SheetPrecoProduto } from './sheet-preco-produto';

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('SheetPrecoProduto', () => {
  it('abre com o campo "Quanto costuma custar" em foco automático (não regredir — ACHADO-3-8)', async () => {
    await comTema(
      <SheetPrecoProduto visivel nome="Arroz" precoInicial={null} onFechar={jest.fn()} onSalvar={jest.fn()} />,
    );

    expect(screen.getByLabelText('Quanto costuma custar').props.autoFocus).toBe(true);
  });
});
