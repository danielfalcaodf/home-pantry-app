import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { ReactNode } from 'react';
import { ReduceMotion, withSpring, withTiming } from 'react-native-reanimated';

import { StepperConsumo } from '../components/stepper-consumo';
import { ThemeProvider } from './provider';
import { DURACAO_FADE, esmaecer, MOLA, molar } from './movimento';

// Mesmo mock de `react-native-reanimated` já usado no preset de teste do
// projeto (aplica os valores de imediato) — aqui só envolvemos `withSpring`/
// `withTiming` num jest.fn para provar QUAL das duas é chamada, sem mudar o
// comportamento.
jest.mock('react-native-reanimated', () => {
  const real = jest.requireActual('react-native-reanimated');
  return {
    __esModule: true,
    ...real,
    withSpring: jest.fn(real.withSpring),
    withTiming: jest.fn(real.withTiming),
  };
});

describe('theme/movimento — respeita a preferência de redução de movimento (ACHADO-019)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('esmaecer() usa withTiming com DURACAO_FADE, nunca withSpring', () => {
    esmaecer(1);
    expect(withTiming).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ duration: DURACAO_FADE, reduceMotion: ReduceMotion.System }),
    );
    expect(withSpring).not.toHaveBeenCalled();
  });

  it('molar() usa withSpring com a configuração de mola do app, nunca withTiming', () => {
    molar(1);
    expect(withSpring).toHaveBeenCalledWith(1, MOLA);
    expect(withTiming).not.toHaveBeenCalled();
  });

  it('MOLA delega a `ReduceMotion.System` — o Reanimated respeita a preferência sozinho', () => {
    expect(MOLA.reduceMotion).toBe(ReduceMotion.System);
  });

  it('o retorno tátil continua disparado mesmo quando a transição usa esmaecer()', async () => {
    async function comTema(no: ReactNode) {
      await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
    }
    await comTema(
      <StepperConsumo rotuloAcessivel="Registrar consumo" onRegistrar={jest.fn()} />,
    );
    fireEvent.press(screen.getByLabelText('Registrar consumo'));
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });
});
