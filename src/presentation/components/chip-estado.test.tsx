import { render, fireEvent, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import { ReactNode } from 'react';

import { sobrepor } from '../theme/contraste';
import { despensa, porcelana } from '../theme/tokens';
import { ThemeProvider } from '../theme/provider';
import { ChipEstado } from './chip-estado';

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

function estiloDoChip(elemento: { props: { style?: unknown } }) {
  const bruto = elemento.props.style;
  return Array.isArray(bruto) ? Object.assign({}, ...bruto) : bruto;
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

  // Prova do cenário do bug (correcao-chip-invisivel-em-sheet, task 2.1):
  // sem `cor`, o fundo do chip ativo não pode ser igual ao fundo de um sheet
  // (`tema.bg.raised`) — senão o chip fica visualmente invisível dentro dele.
  it('ativo sem cor, dentro de um sheet (bg.raised): fundo do chip é diferente do fundo do container', async () => {
    await render(
      <ThemeProvider preferencia="escuro">
        <View style={{ backgroundColor: despensa.bg.raised }}>
          <ChipEstado rotulo="Un" ativo onPress={() => {}} />
        </View>
      </ThemeProvider>,
    );
    const chip = screen.getByRole('button', { name: 'Un' });
    const estilo = estiloDoChip(chip);
    expect(estilo.backgroundColor).not.toBe(despensa.bg.raised);
    expect(estilo.backgroundColor).toBe(
      sobrepor(despensa.action.azulejo, despensa.bg.base, despensa.fillOpacity),
    );
  });

  // Task 3.1: mesmo cenário em tela cheia (bg.base) — já era correto antes,
  // a correção não pode regredir esse caso.
  it('ativo sem cor, em tela cheia (bg.base): continua distinguível do container', async () => {
    await render(
      <ThemeProvider preferencia="escuro">
        <View style={{ backgroundColor: despensa.bg.base }}>
          <ChipEstado rotulo="Un" ativo onPress={() => {}} />
        </View>
      </ThemeProvider>,
    );
    const chip = screen.getByRole('button', { name: 'Un' });
    const estilo = estiloDoChip(chip);
    expect(estilo.backgroundColor).not.toBe(despensa.bg.base);
  });

  // Task 3.2: os 5 call sites reais de ChipEstado sem `cor`, nos dois temas —
  // nenhum perde contraste entre o fundo ativo e o fundo do sheet/tela.
  describe.each([
    ['despensa (escuro)', despensa],
    ['porcelana (claro)', porcelana],
  ])('%s — call sites sem cor', (_nome, tema) => {
    it.each([
      ['sheet-avulso: Medida'],
      ['sheet-ajuste-estoque: Motivo'],
      ['item-compra: Sim/Não'],
      ['formulario-produto: Medida'],
      ['formulario-produto: sugestão de categoria'],
    ])('%s — fundo ativo contrasta com bg.raised e com bg.base', async (rotulo) => {
      await render(
        <ThemeProvider preferencia={tema.nome === 'despensa' ? 'escuro' : 'claro'}>
          <View style={{ backgroundColor: tema.bg.raised }}>
            <ChipEstado rotulo={rotulo} ativo onPress={() => {}} />
          </View>
        </ThemeProvider>,
      );
      const chip = screen.getByRole('button', { name: rotulo });
      const estilo = estiloDoChip(chip);
      expect(estilo.backgroundColor).not.toBe(tema.bg.raised);
      expect(estilo.backgroundColor).not.toBe(tema.bg.base);
    });
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
