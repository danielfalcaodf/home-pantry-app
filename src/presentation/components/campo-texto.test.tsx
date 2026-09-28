import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ReactNode, useState } from 'react';

import { ThemeProvider } from '../theme/provider';
import { CampoTexto } from './campo-texto';

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

afterEach(cleanup);

describe('CampoTexto — tipo="quantidade" (máscara)', () => {
  it('mantém dígitos e uma vírgula decimal, descartando letras e outros símbolos', async () => {
    const onChangeText = jest.fn();
    await comTema(<CampoTexto rotulo="Quantidade" value="" onChangeText={onChangeText} tipo="quantidade" />);

    fireEvent.changeText(screen.getByLabelText('Quantidade'), '1a,5b');

    expect(onChangeText).toHaveBeenCalledWith('1,5');
  });

  it('trunca a parte decimal em 3 casas', async () => {
    const onChangeText = jest.fn();
    await comTema(<CampoTexto rotulo="Quantidade" value="" onChangeText={onChangeText} tipo="quantidade" />);

    fireEvent.changeText(screen.getByLabelText('Quantidade'), '1,23456');

    expect(onChangeText).toHaveBeenCalledWith('1,234');
  });

  it('converte ponto em vírgula', async () => {
    const onChangeText = jest.fn();
    await comTema(<CampoTexto rotulo="Quantidade" value="" onChangeText={onChangeText} tipo="quantidade" />);

    fireEvent.changeText(screen.getByLabelText('Quantidade'), '1.5');

    expect(onChangeText).toHaveBeenCalledWith('1,5');
  });

  it('preserva o sinal negativo (a validação de negativo é de quem usa o campo, não da máscara)', async () => {
    const onChangeText = jest.fn();
    await comTema(<CampoTexto rotulo="Quantidade" value="" onChangeText={onChangeText} tipo="quantidade" />);

    fireEvent.changeText(screen.getByLabelText('Quantidade'), '-3');

    expect(onChangeText).toHaveBeenCalledWith('-3');
  });
});

describe('CampoTexto — tipo="dinheiro" (máscara "de caixa registradora")', () => {
  it('a partir do 3º dígito, os centavos empurram e a vírgula se ajusta sozinha', async () => {
    const onChangeText = jest.fn();
    await comTema(<CampoTexto rotulo="Preço" value="" onChangeText={onChangeText} tipo="dinheiro" />);

    const campo = screen.getByLabelText('Preço');
    // Desde o 1º dígito: cada tecla entra como centavo pela direita (o
    // campo exibe "R$ 0,01", o TextInput entrega o exibido + a nova tecla).
    fireEvent.changeText(campo, '1');
    await waitFor(() => expect(onChangeText).toHaveBeenLastCalledWith('0,01'));
    fireEvent.changeText(campo, 'R$ 0,01' + '2');
    await waitFor(() => expect(onChangeText).toHaveBeenLastCalledWith('0,12'));
    fireEvent.changeText(campo, 'R$ 0,12' + '9');
    await waitFor(() => expect(onChangeText).toHaveBeenLastCalledWith('1,29'));
    fireEvent.changeText(campo, 'R$ 1,29' + '0');
    await waitFor(() => expect(onChangeText).toHaveBeenLastCalledWith('12,90'));
  });

  it('ignora qualquer caractere não numérico digitado (só os dígitos contam)', async () => {
    const onChangeText = jest.fn();
    await comTema(<CampoTexto rotulo="Preço" value="" onChangeText={onChangeText} tipo="dinheiro" />);

    fireEvent.changeText(screen.getByLabelText('Preço'), 'R$1.290abc');

    expect(onChangeText).toHaveBeenCalledWith('12,90');
  });

  it('campo vazio permanece vazio', async () => {
    const onChangeText = jest.fn();
    await comTema(<CampoTexto rotulo="Preço" value="" onChangeText={onChangeText} tipo="dinheiro" />);

    fireEvent.changeText(screen.getByLabelText('Preço'), '');

    expect(onChangeText).toHaveBeenCalledWith('');
  });

  it('apagar um dígito (backspace) reduz o valor corretamente', async () => {
    const onChangeText = jest.fn();
    await comTema(<CampoTexto rotulo="Preço" value="" onChangeText={onChangeText} tipo="dinheiro" />);

    // Simula o texto já mascorado "12,90" com o último dígito apagado pelo
    // usuário — o TextInput entrega "12,9" (sem o "0" final) ao onChangeText.
    fireEvent.changeText(screen.getByLabelText('Preço'), '12,9');

    expect(onChangeText).toHaveBeenCalledWith('1,29');
  });
});

describe('CampoTexto — dinheiro com R$ e peso em kg (caixa registradora)', () => {
  it('exibe o valor controlado com o prefixo R$ e milhar', async () => {
    await comTema(<CampoTexto rotulo="Preço" value="1234,5" onChangeText={() => {}} tipo="dinheiro" />);
    expect(screen.getByLabelText('Preço').props.accessibilityValue.text).toBe('R$ 1.234,50');
  });

  it('entrega o valor sem prefixo nem separador de milhar (parseável por Number)', async () => {
    const onChangeText = jest.fn();
    await comTema(<CampoTexto rotulo="Preço" value="" onChangeText={onChangeText} tipo="dinheiro" />);

    await fireEvent.changeText(screen.getByLabelText('Preço'), 'R$ 1.234,567');

    expect(onChangeText).toHaveBeenCalledWith('12345,67');
  });

  it('peso: gramas entram pela direita com 3 casas (5 → 0,005, 500 → 0,500)', async () => {
    const onChangeText = jest.fn();
    await comTema(<CampoTexto rotulo="Peso" value="" onChangeText={onChangeText} tipo="peso" />);
    const campo = screen.getByLabelText('Peso');

    await fireEvent.changeText(campo, '5');
    expect(onChangeText).toHaveBeenLastCalledWith('0,005');
    await fireEvent.changeText(campo, '500');
    expect(onChangeText).toHaveBeenLastCalledWith('0,500');
    await fireEvent.changeText(campo, '1500');
    expect(onChangeText).toHaveBeenLastCalledWith('1,500');
  });

  it('peso: valor semeado com menos casas é lido como número, não como dígitos', async () => {
    await comTema(<CampoTexto rotulo="Peso" value="0,5" onChangeText={() => {}} tipo="peso" />);
    expect(screen.getByLabelText('Peso').props.accessibilityValue.text).toBe('0,500');
  });

  it('peso: apagar o último dígito desloca para a direita', async () => {
    const onChangeText = jest.fn();
    await comTema(<CampoTexto rotulo="Peso" value="0,500" onChangeText={onChangeText} tipo="peso" />);

    await fireEvent.changeText(screen.getByLabelText('Peso'), '0,50');

    expect(onChangeText).toHaveBeenCalledWith('0,050');
  });
});

describe('CampoTexto — sem piscar no TextInput controlado', () => {
  function PesoControlado() {
    const [valor, setValor] = useState('');
    return <CampoTexto rotulo="Peso" value={valor} onChangeText={setValor} tipo="peso" />;
  }

  // O piscar "5 → 0,005" vem do nativo aplicar a tecla antes do JS devolver
  // o valor formatado. Se o valor nativo é exatamente o que foi digitado,
  // não há correção a aplicar — o formatado só aparece no texto sobreposto.
  it('o TextInput guarda só os dígitos digitados; o formatado vai para o texto por cima', async () => {
    await comTema(<PesoControlado />);
    const campo = screen.getByLabelText('Peso');

    await fireEvent.changeText(campo, '5');
    expect(screen.getByLabelText('Peso').props.value).toBe('5');
    expect(screen.getByText('0,005')).toBeTruthy();

    await fireEvent.changeText(campo, '50');
    expect(screen.getByLabelText('Peso').props.value).toBe('50');
    expect(screen.getByText('0,050')).toBeTruthy();
    expect(screen.getByLabelText('Peso').props.accessibilityValue.text).toBe('0,050');
  });
});

describe('CampoTexto — placeholder padrão por tipo', () => {
  it('usa "0,000" para tipo="quantidade" quando nenhum placeholder é passado', async () => {
    await comTema(<CampoTexto rotulo="Quantidade" value="" onChangeText={() => {}} tipo="quantidade" />);
    expect(screen.getByLabelText('Quantidade').props.placeholder).toBe('0,000');
  });

  it('usa "0,00" para tipo="dinheiro" quando nenhum placeholder é passado', async () => {
    await comTema(<CampoTexto rotulo="Preço" value="" onChangeText={() => {}} tipo="dinheiro" />);
    expect(screen.getByLabelText('Preço').props.placeholder).toBe('R$ 0,00');
  });

  it('um placeholder explícito sobrescreve o padrão do tipo', async () => {
    await comTema(
      <CampoTexto rotulo="Preço" value="" onChangeText={() => {}} tipo="dinheiro" placeholder="grátis" />,
    );
    expect(screen.getByLabelText('Preço').props.placeholder).toBe('grátis');
  });

  it('sem tipo, não há placeholder por padrão', async () => {
    await comTema(<CampoTexto rotulo="Nome" value="" onChangeText={() => {}} />);
    expect(screen.getByLabelText('Nome').props.placeholder).toBeUndefined();
  });
});

describe('CampoTexto — sem tipo, sem máscara (não regride campos de texto livre)', () => {
  it('repassa o texto digitado sem alterar', async () => {
    const onChangeText = jest.fn();
    await comTema(<CampoTexto rotulo="Nome" value="" onChangeText={onChangeText} />);

    fireEvent.changeText(screen.getByLabelText('Nome'), 'Arroz, 5kg!');

    expect(onChangeText).toHaveBeenCalledWith('Arroz, 5kg!');
  });
});

describe('CampoTexto — erro em texto (feedback)', () => {
  it('mostra a mensagem de erro quando presente', async () => {
    await comTema(
      <CampoTexto rotulo="Quantidade" value="" onChangeText={() => {}} erro="Valor inválido" />,
    );
    expect(screen.getByText('Valor inválido')).toBeTruthy();
  });

  it('não mostra nada quando não há erro', async () => {
    await comTema(<CampoTexto rotulo="Quantidade" value="" onChangeText={() => {}} />);
    expect(screen.queryByText('Valor inválido')).toBeNull();
  });
});
