import { observadorDoBanco } from './observador';

const mockRemove = jest.fn();
const mockAddDatabaseChangeListener = jest.fn((listener: () => void) => {
  mockListenerRegistrado = listener;
  return { remove: mockRemove };
});
let mockListenerRegistrado: (() => void) | undefined;

jest.mock('expo-sqlite', () => ({
  addDatabaseChangeListener: (listener: () => void) => mockAddDatabaseChangeListener(listener),
}));

describe('observadorDoBanco', () => {
  beforeEach(() => {
    mockRemove.mockClear();
    mockAddDatabaseChangeListener.mockClear();
    mockListenerRegistrado = undefined;
  });

  it('assinar() registra o ouvinte no change listener do expo-sqlite', () => {
    observadorDoBanco.assinar(jest.fn());

    expect(mockAddDatabaseChangeListener).toHaveBeenCalledTimes(1);
  });

  it('o callback registrado invoca o ouvinte', () => {
    const ouvinte = jest.fn();

    observadorDoBanco.assinar(ouvinte);
    mockListenerRegistrado?.();

    expect(ouvinte).toHaveBeenCalledTimes(1);
  });

  it('a função de cancelamento retornada remove a inscrição', () => {
    const cancelar = observadorDoBanco.assinar(jest.fn());

    expect(mockRemove).not.toHaveBeenCalled();
    cancelar();

    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});
