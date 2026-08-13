import { cleanup, render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { centavos } from '../../domain/shared/dinheiro';
import { ThemeProvider } from '../theme/provider';
import { RodapeTotal } from './rodape-total';

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

afterEach(cleanup);

describe('RodapeTotal', () => {
  it('exibe a contagem de itens e o total com o rótulo "estimado"', async () => {
    await comTema(<RodapeTotal contagemItens={15} total={centavos(18940)} contagemSemPreco={0} />);

    expect(screen.getByText('15 itens · R$ 189,40 estimado')).toBeTruthy();
  });

  it('um único item usa o singular', async () => {
    await comTema(<RodapeTotal contagemItens={1} total={centavos(500)} contagemSemPreco={0} />);

    expect(screen.getByText('1 item · R$ 5,00 estimado')).toBeTruthy();
  });

  it('contagemSemPreco zero não renderiza a linha de itens sem preço', async () => {
    await comTema(<RodapeTotal contagemItens={3} total={centavos(1000)} contagemSemPreco={0} />);

    expect(screen.queryByText(/sem preço cadastrado/)).toBeNull();
  });

  it('contagemSemPreco maior que zero renderiza a linha com o número correto', async () => {
    await comTema(<RodapeTotal contagemItens={5} total={centavos(1000)} contagemSemPreco={3} />);

    expect(screen.getByText('3 itens sem preço cadastrado')).toBeTruthy();
  });

  it('contagemSemPreco igual a um usa o singular na linha', async () => {
    await comTema(<RodapeTotal contagemItens={2} total={centavos(500)} contagemSemPreco={1} />);

    expect(screen.getByText('1 item sem preço cadastrado')).toBeTruthy();
  });
});
