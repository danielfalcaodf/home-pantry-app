import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { ThemeProvider } from '@/presentation/theme/provider';
import Diagnostico from './diagnostico';

const mockBack = jest.fn();
const mockVerificar = jest.fn();
const mockCorrigir = jest.fn();
const mockCorrigirTudo = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

let mockEstado: {
  verificando: boolean;
  verificado: boolean;
  divergencias: { produtoId: string; nome: string; materializado: number; calculado: number }[];
} = { verificando: false, verificado: false, divergencias: [] };

jest.mock('@/application/backup/use-diagnostico', () => ({
  useDiagnostico: () => ({
    verificando: mockEstado.verificando,
    verificado: mockEstado.verificado,
    divergencias: mockEstado.divergencias,
    verificar: mockVerificar,
    corrigir: mockCorrigir,
    corrigirTudo: mockCorrigirTudo,
  }),
}));

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('Diagnostico — mensagens de resultado (ACHADO-042)', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockVerificar.mockClear();
    mockCorrigir.mockClear();
    mockCorrigirTudo.mockClear();
  });

  // Task 2.4: mensagem afirmativa quando não há divergência.
  it('sem divergência após verificar, mostra mensagem afirmativa', async () => {
    mockEstado = { verificando: false, verificado: true, divergencias: [] };
    await comTema(<Diagnostico />);
    expect(screen.getByText('Tudo certo — nenhuma divergência encontrada.')).toBeTruthy();
  });

  it('antes de verificar, não mostra nem a mensagem afirmativa nem a de divergência', async () => {
    mockEstado = { verificando: false, verificado: false, divergencias: [] };
    await comTema(<Diagnostico />);
    expect(screen.queryByText('Tudo certo — nenhuma divergência encontrada.')).toBeNull();
  });

  // Task 2.5: mensagem acionável (com ação de corrigir) quando há divergência.
  it('com divergência, mostra mensagem acionável e um "Corrigir" por item', async () => {
    mockEstado = {
      verificando: false,
      verificado: true,
      divergencias: [{ produtoId: 'p1', nome: 'Arroz', materializado: 2000, calculado: 1500 }],
    };
    await comTema(<Diagnostico />);
    expect(
      screen.getByText('1 item com divergência entre o valor registrado e o histórico.'),
    ).toBeTruthy();
    const botaoCorrigir = screen.getByLabelText('Corrigir Arroz');
    expect(botaoCorrigir).toBeTruthy();
    fireEvent.press(botaoCorrigir);
    expect(mockCorrigir).toHaveBeenCalledWith('p1');
  });

  it('com mais de uma divergência, oferece "Corrigir tudo" numa única ação', async () => {
    mockEstado = {
      verificando: false,
      verificado: true,
      divergencias: [
        { produtoId: 'p1', nome: 'Arroz', materializado: 2000, calculado: 1500 },
        { produtoId: 'p2', nome: 'Feijão', materializado: 500, calculado: 1000 },
      ],
    };
    await comTema(<Diagnostico />);
    expect(
      screen.getByText('2 itens com divergência entre o valor registrado e o histórico.'),
    ).toBeTruthy();
    fireEvent.press(screen.getByText('Corrigir tudo'));
    expect(mockCorrigirTudo).toHaveBeenCalledTimes(1);
  });
});

describe('Diagnostico — botão Voltar (ACHADO-049, task 5.2)', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockEstado = { verificando: false, verificado: false, divergencias: [] };
  });

  it('tocar no botão "←" chama router.back(), retornando a Configurações', async () => {
    await comTema(<Diagnostico />);
    fireEvent.press(screen.getByLabelText('Voltar'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
