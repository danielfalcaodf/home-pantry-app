import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { sobrepor } from '../theme/contraste';
import { despensa } from '../theme/tokens';
import { ThemeProvider } from '../theme/provider';
import { ChipEstado } from './chip-estado';

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('ChipEstado', () => {
  // ACHADO-017: fundo ativo precisa vir da cor do estado + fillOpacity do
  // tema, não de um `bg.raised` neutro que não carrega o estado.
  it('ativo com cor de estado: fundo é a cor composta com fillOpacity, não bg.raised', async () => {
    const cor = despensa.state.critico;
    await comTema(<ChipEstado rotulo="Acabou" contagem={5} cor={cor} ativo onPress={() => {}} />);

    const chip = screen.getByRole('button', { name: 'Acabou, 5' });
    const estilo = Array.isArray(chip.props.style) ? Object.assign({}, ...chip.props.style) : chip.props.style;

    expect(estilo.backgroundColor).toBe(sobrepor(cor, despensa.bg.base, despensa.fillOpacity));
    expect(estilo.backgroundColor).not.toBe(despensa.bg.raised);
  });

  // Sem regressão do estado não-ativo (task 3.4).
  it('inativo permanece com fundo transparent', async () => {
    await comTema(
      <ChipEstado rotulo="Acabou" contagem={5} cor={despensa.state.critico} onPress={() => {}} />,
    );
    const chip = screen.getByRole('button', { name: 'Acabou, 5' });
    const estilo = Array.isArray(chip.props.style) ? Object.assign({}, ...chip.props.style) : chip.props.style;
    expect(estilo.backgroundColor).toBe('transparent');
  });

  // ACHADO-050: contagem zero não pode desabilitar o chip.
  it('com contagem 0, continua acionável (não fica disabled)', async () => {
    const onPress = jest.fn();
    await comTema(<ChipEstado rotulo="Faltando" contagem={0} onPress={onPress} />);
    const chip = screen.getByRole('button', { name: 'Faltando, 0' });
    expect(chip.props.accessibilityState?.disabled).not.toBe(true);
    fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('rótulo acessível inclui a contagem', async () => {
    await comTema(<ChipEstado rotulo="Cheio" contagem={12} onPress={() => {}} />);
    expect(screen.getByLabelText('Cheio, 12')).toBeTruthy();
  });
});
