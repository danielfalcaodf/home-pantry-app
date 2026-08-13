import { renderHook } from '@testing-library/react-native';
import { BackHandler, Keyboard } from 'react-native';

import { useVoltarFechaTeclado } from './use-voltar-fecha-teclado';

describe('useVoltarFechaTeclado (ACHADO-056)', () => {
  let aoVoltar: (() => boolean) | undefined;
  let remover: jest.Mock;

  beforeEach(() => {
    remover = jest.fn();
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_evento, handler) => {
      aoVoltar = handler as () => boolean;
      return { remove: remover };
    });
    jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    aoVoltar = undefined;
  });

  it('com teclado aberto, Voltar fecha o teclado e consome o evento', async () => {
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(true);
    await renderHook(() => useVoltarFechaTeclado());

    expect(aoVoltar!()).toBe(true); // evento consumido: a tela permanece
    expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
  });

  it('com teclado fechado, Voltar segue a navegação normal', async () => {
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
    await renderHook(() => useVoltarFechaTeclado());

    expect(aoVoltar!()).toBe(false); // não consumido: o sistema navega
    expect(Keyboard.dismiss).not.toHaveBeenCalled();
  });

  it('remove o listener ao desmontar', async () => {
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
    const { unmount } = await renderHook(() => useVoltarFechaTeclado());
    await unmount();
    expect(remover).toHaveBeenCalledTimes(1);
  });
});
