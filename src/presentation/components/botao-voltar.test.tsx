import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { ThemeProvider } from '../theme/provider';
import { BotaoVoltar } from './botao-voltar';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

const CONFIRMACAO = { titulo: 'Sair da compra?', mensagem: 'A compra continua aberta com o que você já marcou.' };

/** Simula o usuário escolhendo um dos botões do Alert (padrão já usado em
 *  testes de `confirmarCancelamento`, mesma tela). */
function responderAlert(rotulo: string) {
  const chamada = (Alert.alert as jest.Mock).mock.calls.at(-1);
  const botoes = chamada?.[2] as { text: string; onPress?: () => void }[];
  botoes.find((botao) => botao.text === rotulo)?.onPress?.();
}

describe('BotaoVoltar', () => {
  beforeEach(() => {
    mockBack.mockClear();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renderiza com rótulo acessível "Voltar"', async () => {
    await render(
      <ThemeProvider preferencia="escuro">
        <BotaoVoltar />
      </ThemeProvider>,
    );
    expect(screen.getByLabelText('Voltar')).toBeTruthy();
  });

  it('chama router.back() ao tocar', async () => {
    await render(
      <ThemeProvider preferencia="escuro">
        <BotaoVoltar />
      </ThemeProvider>,
    );
    fireEvent.press(screen.getByLabelText('Voltar'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  // ACHADO-034: com prop de confirmação (modo compra, marcados > 0), o
  // aviso de saída é acionado pelo próprio gesto, não texto desvinculado.
  it('com `confirmar`, tocar abre o aviso e só chama router.back() após confirmar', async () => {
    await render(
      <ThemeProvider preferencia="escuro">
        <BotaoVoltar confirmar={CONFIRMACAO} />
      </ThemeProvider>,
    );
    fireEvent.press(screen.getByLabelText('Voltar'));
    expect(Alert.alert).toHaveBeenCalledWith(
      CONFIRMACAO.titulo,
      CONFIRMACAO.mensagem,
      expect.any(Array),
    );
    expect(mockBack).not.toHaveBeenCalled();

    responderAlert('Sair');
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('sem `confirmar`, chama router.back() direto sem Alert (Detalhe/Cadastrar produto)', async () => {
    await render(
      <ThemeProvider preferencia="escuro">
        <BotaoVoltar />
      </ThemeProvider>,
    );
    fireEvent.press(screen.getByLabelText('Voltar'));
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('cancelar o aviso ("Manter") mantém a tela: nenhuma navegação ocorre', async () => {
    await render(
      <ThemeProvider preferencia="escuro">
        <BotaoVoltar confirmar={CONFIRMACAO} />
      </ThemeProvider>,
    );
    fireEvent.press(screen.getByLabelText('Voltar'));
    responderAlert('Manter');
    expect(mockBack).not.toHaveBeenCalled();
  });
});
