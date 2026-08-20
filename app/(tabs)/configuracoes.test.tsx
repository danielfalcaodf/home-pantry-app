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

const mockExportarBackup = jest.fn();
const mockExportarDados = jest.fn();

jest.mock('@/application/backup/use-exportar-backup', () => ({
  useExportarBackup: () => ({ exportando: false, exportar: mockExportarBackup }),
}));
jest.mock('@/application/backup/use-exportar-dados', () => ({
  useExportarDados: () => ({ exportando: false, exportar: mockExportarDados }),
}));
const mockCancelar = jest.fn();
let mockEstadoRestauracao: unknown = { fase: 'ocioso' };

jest.mock('@/application/backup/use-restaurar-backup', () => ({
  useRestaurarBackup: () => ({
    estado: mockEstadoRestauracao,
    selecionar: jest.fn(),
    confirmar: jest.fn(),
    cancelar: mockCancelar,
  }),
}));
let mockUltimoBackupEm = '';

jest.mock('@/application/backup/use-ultimo-backup', () => ({
  useUltimoBackup: () => ({ ultimoBackupEm: mockUltimoBackupEm, recarregar: jest.fn() }),
}));
const mockPedirConfirmacaoApagarTudo = jest.fn();
const mockConfirmarApagarTudo = jest.fn();
const mockCancelarApagarTudo = jest.fn();
let mockEstadoApagarTudo: unknown = { fase: 'ocioso' };

jest.mock('@/application/backup/use-apagar-todos-os-dados', () => ({
  useApagarTodosOsDados: () => ({
    estado: mockEstadoApagarTudo,
    pedirConfirmacao: mockPedirConfirmacaoApagarTudo,
    confirmar: mockConfirmarApagarTudo,
    cancelar: mockCancelarApagarTudo,
  }),
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
    mockCancelar.mockClear();
    mockExportarBackup.mockClear();
    mockExportarDados.mockClear();
    mockEstadoRestauracao = { fase: 'ocioso' };
    mockUltimoBackupEm = '';
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

  // ACHADO-039 — prova do cenário do bug (tasks 2.1/2.2): o toast de
  // divergência ganha uma ação "Corrigir" que navega ao Diagnóstico.
  describe('encadeamento pós-restauração com divergência (ACHADO-039)', () => {
    beforeEach(() => {
      mockEstadoRestauracao = {
        fase: 'concluido',
        divergencias: [{ produtoId: 'p1' }, { produtoId: 'p2' }],
      };
    });

    it('exibe uma ação visível "Corrigir" no toast de divergência', async () => {
      await comTema(<Configuracoes />);
      expect(screen.getByLabelText('Corrigir')).toBeTruthy();
    });

    it('tocar em "Corrigir" navega para /diagnostico', async () => {
      await comTema(<Configuracoes />);
      fireEvent.press(screen.getByLabelText('Corrigir'));
      expect(mockPush).toHaveBeenCalledWith('/diagnostico');
    });
  });

  // Casos de borda do mesmo contexto (tasks 3.1/3.2).
  describe('toast de restauração sem ação de corrigir', () => {
    it('restauração concluída sem divergências não exibe nenhuma ação', async () => {
      mockEstadoRestauracao = { fase: 'concluido', divergencias: [] };
      await comTema(<Configuracoes />);
      expect(screen.getByText('Backup restaurado.')).toBeTruthy();
      expect(screen.queryByLabelText('Corrigir')).toBeNull();
    });

    it('restauração com fase erro exibe o toast de erro sem ação de corrigir', async () => {
      mockEstadoRestauracao = { fase: 'erro', mensagem: 'Falha ao restaurar. Tente novamente.' };
      await comTema(<Configuracoes />);
      expect(screen.getByText('Falha ao restaurar. Tente novamente.')).toBeTruthy();
      expect(screen.queryByLabelText('Corrigir')).toBeNull();
    });
  });

  // ACHADO-038 — teste de composição da tela (tasks 4.1-4.4).
  describe('composição de "Seus dados"', () => {
    it('agrupa backup, restaurar e exportar sob a seção "Seus dados"', async () => {
      await comTema(<Configuracoes />);
      expect(screen.getByText('Seus dados')).toBeTruthy();
      expect(screen.getByText('Fazer backup agora')).toBeTruthy();
      expect(screen.getByText('Restaurar backup')).toBeTruthy();
      expect(screen.getByText('Exportar meus dados (CSV)')).toBeTruthy();
    });

    it('distingue a ação de restaurar como destrutiva: variante secundária e texto de efeito', async () => {
      await comTema(<Configuracoes />);
      const restaurar = screen.getByText('Restaurar backup');
      expect(
        screen.getByText('Substitui os dados existentes pelos deste backup. Não pode ser desfeito.'),
      ).toBeTruthy();
      // variante secundária = mesmo estilo visual usado por "Exportar meus dados (CSV)"
      const exportar = screen.getByText('Exportar meus dados (CSV)');
      expect(restaurar.parent).toBeTruthy();
      expect(exportar.parent).toBeTruthy();
      expect(estiloResolvido(restaurar.parent!).backgroundColor).toEqual(
        estiloResolvido(exportar.parent!).backgroundColor,
      );
    });

    it('"Fazer backup agora" executa direto, sem diálogo de confirmação', async () => {
      await comTema(<Configuracoes />);
      fireEvent.press(screen.getByText('Fazer backup agora'));
      expect(mockExportarBackup).toHaveBeenCalled();
      expect(screen.queryByText(/sobrescreve/i)).toBeNull();
    });

    it('"Exportar meus dados (CSV)" executa direto, sem diálogo de confirmação', async () => {
      await comTema(<Configuracoes />);
      fireEvent.press(screen.getByText('Exportar meus dados (CSV)'));
      expect(mockExportarDados).toHaveBeenCalled();
      expect(screen.queryByText(/sobrescreve/i)).toBeNull();
    });

    it('exibe a data do último backup quando já houve um', async () => {
      mockUltimoBackupEm = String(new Date('2026-08-10T12:00:00').getTime());
      await comTema(<Configuracoes />);
      expect(screen.getByText(/Último backup em 10\/08\/2026/)).toBeTruthy();
    });

    it('exibe convite para o primeiro backup quando nunca houve um', async () => {
      mockUltimoBackupEm = '';
      await comTema(<Configuracoes />);
      expect(screen.getByText('Você ainda não fez backup.')).toBeTruthy();
    });
  });
});
