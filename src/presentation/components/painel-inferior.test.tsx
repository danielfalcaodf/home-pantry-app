import { fireEvent, render, screen, cleanup } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';

import { ThemeProvider } from '../theme/provider';
import { PainelInferior } from './painel-inferior';

afterEach(cleanup);

// O `Modal` real não roda sob Jest (sem bridge nativa, `onShow` nunca
// dispara) — mock do submódulo específico (não do pacote `react-native`
// inteiro, que reabriria a cadeia de módulos nativos do jest-expo) só pra
// capturar o callback que o PainelInferior repassa, e provar que ele é
// chamado pelo `onShow` do Modal (não na montagem), sem depender de focar
// de fato um TextInput real.
let onShowCapturado: (() => void) | undefined;
jest.mock('react-native/Libraries/Modal/Modal', () => ({
  __esModule: true,
  default: ({ visible, onShow, children }: { visible: boolean; onShow?: () => void; children: ReactNode }) => {
    onShowCapturado = onShow;
    return visible ? children : null;
  },
}));

describe('PainelInferior', () => {
  it('toque no backdrop fecha o painel', async () => {
    const onFechar = jest.fn();
    await render(
      <ThemeProvider preferencia="escuro">
        <PainelInferior visivel onFechar={onFechar}>
          <Text>Conteúdo</Text>
        </PainelInferior>
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByLabelText('Fechar'));

    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it('toque no card não propaga pro backdrop — não fecha o painel', async () => {
    const onFechar = jest.fn();
    await render(
      <ThemeProvider preferencia="escuro">
        <PainelInferior visivel onFechar={onFechar}>
          <Text>Conteúdo</Text>
        </PainelInferior>
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByText('Conteúdo'));

    expect(onFechar).not.toHaveBeenCalled();
  });

  it('conteúdo não é renderizado quando `visivel` é falso', async () => {
    await render(
      <ThemeProvider preferencia="escuro">
        <PainelInferior visivel={false} onFechar={jest.fn()}>
          <Text>Conteúdo</Text>
        </PainelInferior>
      </ThemeProvider>,
    );

    expect(screen.queryByText('Conteúdo')).toBeNull();
  });

  it('só chama `onAberto` quando o Modal nativo dispara `onShow`, nunca na montagem (correcao-sheets-ajuste-sem-autofoco)', async () => {
    jest.useFakeTimers();
    const onAberto = jest.fn();
    await render(
      <ThemeProvider preferencia="escuro">
        <PainelInferior visivel onFechar={jest.fn()} onAberto={onAberto}>
          <Text>Conteúdo</Text>
        </PainelInferior>
      </ThemeProvider>,
    );

    expect(onAberto).not.toHaveBeenCalled();

    onShowCapturado?.();
    // `onAberto` só dispara depois do atraso empírico contra o mesmo bug
    // que este teste documenta (ver painel-inferior.tsx): no Android real,
    // chamar `.focus()` direto no `onShow` ainda falhava — a janela reporta
    // "aparecida" antes do SO terminar de conceder foco de input pra ela.
    expect(onAberto).not.toHaveBeenCalled();
    jest.runAllTimers();

    expect(onAberto).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
