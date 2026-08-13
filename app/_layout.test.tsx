import { render, screen } from '@testing-library/react-native';

import RootLayout from './_layout';

// `composicao/banco.ts` chama `fazerBackupSeMigrationPendente(sqliteBruto)`
// no carregamento do módulo — o cliente real abriria um banco SQLite de
// dispositivo, então é mockado aqui (design D3 da change).
jest.mock('@/infrastructure/db/client', () => ({ db: {}, sqliteBruto: {} }));
jest.mock('@/infrastructure/db/backup-pre-migration', () => ({
  fazerBackupSeMigrationPendente: jest.fn(),
}));
// `.sql` via loader do Metro, não resolvível sob Jest.
jest.mock('@/infrastructure/db/migrations/migrations', () => ({}));

const mockUseMigrations = jest.fn();
jest.mock('drizzle-orm/expo-sqlite/migrator', () => ({
  useMigrations: (db: unknown, migrations: unknown) => mockUseMigrations(db, migrations),
}));

jest.mock('@/application/tema/use-preferencia-de-tema', () => ({
  usePreferenciaDeTemaPersistida: () => ({
    preferencia: 'escuro',
    carregada: true,
    escolher: jest.fn(),
  }),
}));

jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));

const mockHideAsync = jest.fn(() => Promise.resolve());
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: () => mockHideAsync(),
}));

jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return { Stack: () => <Text>Rotas</Text> };
});

describe('RootLayout — preparação do banco (ACHADO-012)', () => {
  beforeEach(() => {
    mockUseMigrations.mockClear();
    mockHideAsync.mockClear();
  });

  it('useMigrations com sucesso renderiza a rota normal, não TelaErro', async () => {
    mockUseMigrations.mockReturnValue({ success: true, error: undefined });

    await render(<RootLayout />);

    expect(screen.queryByText(/Não foi possível preparar seus dados/)).toBeNull();
  });

  it('useMigrations com erro renderiza TelaErro e não alcança a interface normal', async () => {
    mockUseMigrations.mockReturnValue({
      success: false,
      error: new Error('falha ao migrar'),
    });

    await render(<RootLayout />);

    expect(screen.getByText('Não foi possível preparar seus dados')).toBeTruthy();
    expect(screen.getByText('falha ao migrar')).toBeTruthy();
  });
});
