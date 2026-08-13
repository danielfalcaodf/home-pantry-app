import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { DadosDoAvulso } from '../../domain/lista/lista';
import { ThemeProvider } from '../theme/provider';
import { SheetAvulso } from './sheet-avulso';

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

afterEach(cleanup);

describe('SheetAvulso', () => {
  it('salvar com nome preenchido chama onSalvar com os dados corretos', async () => {
    const onSalvar = jest.fn();
    await comTema(<SheetAvulso visivel inicial={undefined} onFechar={jest.fn()} onSalvar={onSalvar} />);

    await fireEvent.changeText(screen.getByLabelText('O que é'), 'Carvão');
    await fireEvent.press(screen.getByText('Adicionar'));

    expect(onSalvar).toHaveBeenCalledWith({
      nome: 'Carvão',
      unidade: 'un',
      quantidade: 1,
      preco: null,
    });
  });

  it('nome vazio exibe o erro e não chama onSalvar', async () => {
    const onSalvar = jest.fn();
    await comTema(<SheetAvulso visivel onFechar={jest.fn()} onSalvar={onSalvar} />);

    await fireEvent.press(screen.getByText('Adicionar'));

    expect(screen.getByText('Dê um nome ao item')).toBeTruthy();
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it('nome só com espaços exibe o erro e não chama onSalvar', async () => {
    const onSalvar = jest.fn();
    await comTema(<SheetAvulso visivel onFechar={jest.fn()} onSalvar={onSalvar} />);

    await fireEvent.changeText(screen.getByLabelText('O que é'), '   ');
    await fireEvent.press(screen.getByText('Adicionar'));

    expect(screen.getByText('Dê um nome ao item')).toBeTruthy();
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it('preço em branco entra como null nos dados salvos', async () => {
    const onSalvar = jest.fn();
    await comTema(<SheetAvulso visivel onFechar={jest.fn()} onSalvar={onSalvar} />);

    await fireEvent.changeText(screen.getByLabelText('O que é'), 'Gelo');
    await fireEvent.changeText(screen.getByLabelText('Preço (opcional)'), '');
    await fireEvent.press(screen.getByText('Adicionar'));

    expect(onSalvar).toHaveBeenCalledWith(expect.objectContaining({ preco: null }));
  });

  it('modo de edição popula os campos a partir do item existente', async () => {
    const inicial: DadosDoAvulso = {
      nome: 'Pilha AA',
      unidade: 'un',
      quantidade: 4,
      preco: 12.5,
    };
    await comTema(<SheetAvulso visivel inicial={inicial} onFechar={jest.fn()} onSalvar={jest.fn()} />);

    expect(screen.getByLabelText('O que é').props.value).toBe('Pilha AA');
    expect(screen.getByLabelText('Quantidade').props.value).toBe('4');
    expect(screen.getByLabelText('Preço (opcional)').props.value).toBe('12.5');
    expect(screen.getByText('Editar item')).toBeTruthy();
    expect(screen.getByText('Salvar')).toBeTruthy();
  });
});
