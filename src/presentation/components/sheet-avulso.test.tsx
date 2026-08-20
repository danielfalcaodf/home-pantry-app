import { cleanup, fireEvent, render, screen, within } from '@testing-library/react-native';
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

  it('quantidade inválida é rejeitada com erro em texto, sem chamar onSalvar (Error Prevention)', async () => {
    const onSalvar = jest.fn();
    await comTema(<SheetAvulso visivel onFechar={jest.fn()} onSalvar={onSalvar} />);

    await fireEvent.changeText(screen.getByLabelText('O que é'), 'Gelo');
    await fireEvent.changeText(screen.getByLabelText('Quantidade'), '0');
    await fireEvent.press(screen.getByText('Adicionar'));

    expect(screen.getByText('Diga quanto você está levando')).toBeTruthy();
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it('preço nunca fica em estado inválido — a máscara só deixa dígitos virarem centavos (Error Prevention)', async () => {
    const onSalvar = jest.fn();
    await comTema(<SheetAvulso visivel onFechar={jest.fn()} onSalvar={onSalvar} />);

    await fireEvent.changeText(screen.getByLabelText('O que é'), 'Gelo');
    // Digitar algo que não é dígito não produz um valor inválido — a
    // máscara "de caixa registradora" já impede isso na digitação, não
    // sobra pro salvar rejeitar depois.
    await fireEvent.changeText(screen.getByLabelText('Preço (opcional)'), '-');
    expect(screen.getByLabelText('Preço (opcional)').props.value).toBe('');

    await fireEvent.press(screen.getByText('Adicionar'));

    expect(onSalvar).toHaveBeenCalledWith(expect.objectContaining({ preco: null }));
  });

  it('tem um controle de fechar visível, além do toque fora (affordance)', async () => {
    const onFechar = jest.fn();
    await comTema(<SheetAvulso visivel onFechar={onFechar} onSalvar={jest.fn()} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));

    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it('o campo em foco e o botão de ação estão dentro do wrapper que evita o teclado (Keyboard Overlap)', async () => {
    await comTema(<SheetAvulso visivel onFechar={jest.fn()} onSalvar={jest.fn()} />);

    const avoidingView = screen.getByTestId('evita-teclado-avulso');
    expect(within(avoidingView).getByLabelText('O que é')).toBeTruthy();
    expect(within(avoidingView).getByText('Adicionar')).toBeTruthy();
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
    // Duas casas sempre — é o formato que a máscara de dinheiro (tipo="dinheiro")
    // espera pra reconhecer o valor semeado.
    expect(screen.getByLabelText('Preço (opcional)').props.value).toBe('12,50');
    expect(screen.getByText('Editar item')).toBeTruthy();
    expect(screen.getByText('Salvar')).toBeTruthy();
  });

  it('abre com o campo "O que é" em foco automático (não regredir — ACHADO-3-8)', async () => {
    await comTema(<SheetAvulso visivel inicial={undefined} onFechar={jest.fn()} onSalvar={jest.fn()} />);

    expect(screen.getByLabelText('O que é').props.autoFocus).toBe(true);
  });
});
