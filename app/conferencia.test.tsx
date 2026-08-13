import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { ThemeProvider } from '@/presentation/theme/provider';
import Conferencia from './conferencia';

const mockBack = jest.fn();
const mockConfirmar = jest.fn().mockResolvedValue(undefined);
const mockCorrigir = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-router', () => ({
  router: { back: () => mockBack() },
  useRouter: () => ({ back: mockBack }),
}));

jest.mock('@/application/estoque/use-conferencia', () => {
  const { milesimos: paraMilesimos } = jest.requireActual('@/domain/shared/quantidade');
  const itemAtual = {
    id: 'p1',
    nome: 'Arroz',
    categoria: 'Grãos',
    unidade: 'kg',
    quantidadeAtual: paraMilesimos(2000),
  };
  return {
    CONFERENCIA_TUDO: '__TUDO__',
    useConferencia: () => ({
      carregando: false,
      categorias: ['Grãos'],
      categoriaEscolhida: 'Grãos',
      itens: [itemAtual],
      indice: 0,
      itemAtual,
      concluida: false,
      resumo: null,
      escolherCategoria: jest.fn(),
      confirmar: mockConfirmar,
      corrigir: mockCorrigir,
    }),
  };
});

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('Conferencia — item atual', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockConfirmar.mockClear();
    mockCorrigir.mockClear();
  });

  // Cenário exato do ACHADO-062: a tela do item era a única sem saída visível.
  it('exibe um botão "Voltar" acessível e o toque chama router.back()', async () => {
    await comTema(<Conferencia />);
    const botaoVoltar = screen.getByLabelText('Voltar');
    expect(botaoVoltar).toBeTruthy();
    fireEvent.press(botaoVoltar);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  // ACHADO-055: sem valor digitado, "Corrigir" precisa ser perceptivelmente
  // desabilitado, não um no-op silencioso.
  it('sem valor digitado, o botão "Corrigir" fica desabilitado e o toque não grava nada', async () => {
    await comTema(<Conferencia />);
    const botaoCorrigir = screen.getByRole('button', { name: 'Corrigir' });
    expect(botaoCorrigir.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(botaoCorrigir);
    expect(mockCorrigir).not.toHaveBeenCalled();
  });

  it('com valor digitado, o botão "Corrigir" habilita e o toque grava a correção', async () => {
    await comTema(<Conferencia />);
    const campo = screen.getByLabelText('Corrigir para');
    fireEvent.changeText(campo, '3,5');
    await waitFor(() => expect(campo.props.value).toBe('3,5'));

    const botaoCorrigir = screen.getByRole('button', { name: 'Corrigir' });
    expect(botaoCorrigir.props.accessibilityState.disabled).toBe(false);
    fireEvent.press(botaoCorrigir);
    await waitFor(() => expect(mockCorrigir).toHaveBeenCalledTimes(1));
  });

  it('sair pelo Voltar não grava nenhum movimento (não chama confirmar/corrigir)', async () => {
    await comTema(<Conferencia />);
    fireEvent.press(screen.getByLabelText('Voltar'));
    expect(mockConfirmar).not.toHaveBeenCalled();
    expect(mockCorrigir).not.toHaveBeenCalled();
  });
});
