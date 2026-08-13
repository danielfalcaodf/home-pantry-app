import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { ThemeProvider } from '@/presentation/theme/provider';
import { ALVO_TOQUE_MINIMO } from '@/presentation/theme/espaco';
import Configuracoes from './configuracoes';

const mockPush = jest.fn();
const mockEscolherTema = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a) },
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock('@/application/backup/use-exportar-backup', () => ({
  useExportarBackup: () => ({ exportando: false, exportar: jest.fn() }),
}));
jest.mock('@/application/backup/use-exportar-dados', () => ({
  useExportarDados: () => ({ exportando: false, exportar: jest.fn() }),
}));
jest.mock('@/application/backup/use-restaurar-backup', () => ({
  useRestaurarBackup: () => ({
    estado: { fase: 'ocioso' },
    selecionar: jest.fn(),
    confirmar: jest.fn(),
    cancelar: jest.fn(),
  }),
}));
jest.mock('@/application/backup/use-ultimo-backup', () => ({
  useUltimoBackup: () => ({ ultimoBackupEm: null, recarregar: jest.fn() }),
}));

function estiloResolvido(elemento: { props: { style?: unknown } }) {
  const { style } = elemento.props;
  return Array.isArray(style) ? Object.assign({}, ...style) : style;
}

async function comTema(no: ReactNode) {
  await render(
    <ThemeProvider preferencia="escuro" escolher={mockEscolherTema}>
      {no}
    </ThemeProvider>,
  );
}

describe('Configuracoes', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockEscolherTema.mockClear();
  });

  // ACHADO-059 (task 3.2): as três opções de tema precisam medir ≥48dp.
  it('cada opção de tema tem área tocável de no mínimo 48dp de altura', async () => {
    await comTema(<Configuracoes />);
    for (const rotulo of ['Automático', 'Claro', 'Escuro']) {
      const opcao = screen.getByLabelText(`Tema ${rotulo}`);
      expect(estiloResolvido(opcao).minHeight).toBeGreaterThanOrEqual(ALVO_TOQUE_MINIMO);
    }
  });

  // (task 3.3): seleção e persistência da escolha continuam funcionando.
  it('tocar numa opção de tema chama escolherTema e marca accessibilityState.selected', async () => {
    await comTema(<Configuracoes />);
    const claro = screen.getByLabelText('Tema Claro');
    expect(claro.props.accessibilityState).toEqual(expect.objectContaining({ selected: false }));
    const escuro = screen.getByLabelText('Tema Escuro');
    expect(escuro.props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));

    fireEvent.press(claro);
    expect(mockEscolherTema).toHaveBeenCalledWith('claro');
  });

  // ACHADO-060 (task 7.2): jargão "estoque" trocado por "despensa".
  it('exibe "Conferência da despensa" e não "Conferência de estoque"', async () => {
    await comTema(<Configuracoes />);
    expect(screen.getByText('Conferência da despensa')).toBeTruthy();
    expect(screen.queryByText('Conferência de estoque')).toBeNull();
  });

  // (task 7.3): o botão continua navegando para /conferencia.
  it('tocar em "Conferência da despensa" navega para /conferencia', async () => {
    await comTema(<Configuracoes />);
    fireEvent.press(screen.getByText('Conferência da despensa'));
    expect(mockPush).toHaveBeenCalledWith('/conferencia');
  });
});
