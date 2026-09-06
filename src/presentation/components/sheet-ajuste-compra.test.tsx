import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
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

  it('preço vazio salva com preço nulo', async () => {
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

    fireEvent.changeText(screen.getByLabelText('Preço pago (opcional)'), '');
    await waitFor(() => expect(screen.getByLabelText('Preço pago (opcional)').props.value).toBe(''));
    fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSalvar).toHaveBeenCalledWith({ quantidade: 3, preco: null });
  });

  it('quantidade zero é rejeitada com erro em texto, sem chamar onSalvar (Error Prevention)', async () => {
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
    fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(screen.getByText('Diga quanto foi comprado')).toBeTruthy());
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it('preço nunca fica em estado inválido — a máscara só deixa dígitos virarem centavos (Error Prevention)', async () => {
    const onSalvar = jest.fn();
    await comTema(
      <SheetAjusteCompra
        visivel
        nome="Arroz"
        unidade="un"
        quantidadeInicial={3}
        precoInicial={null}
        onFechar={jest.fn()}
        onSalvar={onSalvar}
      />,
    );

    // Digitar algo que não é dígito não produz um valor inválido — a
    // máscara "de caixa registradora" já impede isso na digitação.
    fireEvent.changeText(screen.getByLabelText('Preço pago (opcional)'), '-');
    await waitFor(() => expect(screen.getByLabelText('Preço pago (opcional)').props.value).toBe(''));
    fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSalvar).toHaveBeenCalledWith({ quantidade: 3, preco: null }));
  });

  it('tem um controle de fechar visível, além do toque fora (affordance)', async () => {
    const onFechar = jest.fn();
    await comTema(
      <SheetAjusteCompra
        visivel
        nome="Arroz"
        unidade="un"
        quantidadeInicial={2}
        precoInicial={null}
        onFechar={onFechar}
        onSalvar={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));

    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it('o campo em foco e o botão de ação estão dentro do wrapper que evita o teclado (Keyboard Overlap)', async () => {
    await comTema(
      <SheetAjusteCompra
        visivel
        nome="Arroz"
        unidade="un"
        quantidadeInicial={2}
        precoInicial={null}
        onFechar={jest.fn()}
        onSalvar={jest.fn()}
      />,
    );

    const avoidingView = screen.getByTestId('evita-teclado-ajuste-compra');
    expect(within(avoidingView).getByLabelText(/Quantidade/)).toBeTruthy();
    expect(within(avoidingView).getByRole('button', { name: 'Salvar' })).toBeTruthy();
  });

  it('não usa autoFocus na montagem (ACHADO-3-8, bug real em dispositivo físico)', async () => {
    await comTema(
      <SheetAjusteCompra
        visivel
        nome="Arroz"
        unidade="un"
        quantidadeInicial={2}
        precoInicial={null}
        onFechar={jest.fn()}
        onSalvar={jest.fn()}
      />,
    );

    // `autoFocus` na montagem foi a causa raiz do bug: no Android real o
    // `.focus()` roda antes da janela do Modal estar anexada, então o
    // campo fica com foco lógico sem levantar o teclado. O foco agora só
    // é disparado pelo `onShow` nativo do `Modal` (repassado como
    // `onAberto` — ver painel-inferior.test.tsx para a prova da fiação;
    // o `Modal` real não roda sob Jest, então esse teste só garante que
    // o gatilho de foco na montagem foi removido).
    expect(screen.getByLabelText(/Quantidade/).props.autoFocus).toBeFalsy();
  });

  describe('produto com fator de conversão (change conversao-unidade-de-compra)', () => {
    it('pergunta pacotes, unidades por pacote (pré-preenchido) e valor total, em vez de quantidade/preço direto', async () => {
      const onSalvarPacotes = jest.fn();
      await comTema(
        <SheetAjusteCompra
          visivel
          nome="Papel higiênico"
          unidade="un"
          quantidadeInicial={12}
          precoInicial={null}
          fatorConversaoEmbalagem={12}
          onFechar={jest.fn()}
          onSalvar={jest.fn()}
          onSalvarPacotes={onSalvarPacotes}
        />,
      );

      expect(screen.queryByLabelText(/^Quantidade/)).toBeNull();
      expect(screen.getByLabelText('Unidades no pacote').props.value).toBe('12');

      fireEvent.changeText(screen.getByLabelText('Unidades no pacote'), '16');
      await waitFor(() => expect(screen.getByLabelText('Unidades no pacote').props.value).toBe('16'));
      fireEvent.changeText(screen.getByLabelText('Valor total pago'), '16,00');
      await waitFor(() => expect(screen.getByLabelText('Valor total pago').props.value).toBe('16,00'));
      fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

      expect(onSalvarPacotes).toHaveBeenCalledWith({ pacotes: 1, tamanhoPacote: 16, valorTotal: 16 });
    });

    it('pacotes zerado ou não inteiro é rejeitado com erro em texto', async () => {
      const onSalvarPacotes = jest.fn();
      await comTema(
        <SheetAjusteCompra
          visivel
          nome="Papel higiênico"
          unidade="un"
          quantidadeInicial={12}
          precoInicial={null}
          fatorConversaoEmbalagem={12}
          onFechar={jest.fn()}
          onSalvar={jest.fn()}
          onSalvarPacotes={onSalvarPacotes}
        />,
      );

      fireEvent.changeText(screen.getByLabelText('Quantos pacotes'), '0');
      await waitFor(() => expect(screen.getByLabelText('Quantos pacotes').props.value).toBe('0'));
      fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

      await waitFor(() => expect(screen.getByText('Diga quantos pacotes você comprou')).toBeTruthy());
      expect(onSalvarPacotes).not.toHaveBeenCalled();
    });

    it('produto sem fator mantém o fluxo existente de quantidade/preço direto', async () => {
      await comTema(
        <SheetAjusteCompra
          visivel
          nome="Arroz"
          unidade="un"
          quantidadeInicial={2}
          precoInicial={null}
          fatorConversaoEmbalagem={null}
          onFechar={jest.fn()}
          onSalvar={jest.fn()}
        />,
      );

      expect(screen.queryByLabelText('Unidades no pacote')).toBeNull();
      expect(screen.getByLabelText(/^Quantidade/)).toBeTruthy();
    });
  });
});
