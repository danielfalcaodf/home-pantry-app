import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Keyboard, View as MockView } from 'react-native';

import { milesimos } from '@/domain/shared/quantidade';
import { ThemeProvider } from '@/presentation/theme/provider';
import Despensa from './index';

// `mockUltimoEfeito` guarda o `efeito` mais recente passado a
// `useFocusEffect` — em produção é um `useCallback` com dep `[busca]`, uma
// closure nova a cada tecla digitada. Capturar direto no corpo do mock (sem
// passar por `useEffect`) evita depender do timing de passive effects do
// React/RNTL, que se mostrou instável (act() sobreposto) com o `autoFocus`
// do campo de busca. `dispararBlur()` chama esse efeito e o cleanup que ele
// devolve manualmente, simulando a troca de aba sem uma implementação real
// de navegação. Prefixo `mock` é o que o babel-plugin-jest-hoist exige pra
// permitir referenciar a variável de dentro da factory de `jest.mock`, que
// é hoisted acima deste import.
let mockUltimoEfeito: (() => void | (() => void)) | null = null;

// Chama direto, sem embrulhar num `act()` síncrono: o `autoFocus` do campo
// de busca deixa um `act()` assíncrono pendente sob RNTL, e sincronizar
// manualmente com ele se mostrou instável (a atualização de estado do
// cleanup corria risco de nunca comitar a tempo). As asserções depois de
// `dispararBlur()` usam `waitFor`, que já resolve o commit real assim que
// ele acontece.
function dispararBlur() {
  const cleanup = mockUltimoEfeito?.();
  cleanup?.();
}

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => ({}),
  useFocusEffect: (efeito: () => void | (() => void)) => {
    mockUltimoEfeito = efeito;
  },
}));

// FlashList precisa de layout real para virtualizar (indisponível sob
// Jest); o dublê renderiza `data` diretamente, sem virtualização.
jest.mock('@shopify/flash-list', () => ({
  FlashList: ({ data, renderItem, keyExtractor }: any) => (
    <MockView>
      {data.map((item: any) => (
        <MockView key={keyExtractor(item)}>{renderItem({ item })}</MockView>
      ))}
    </MockView>
  ),
}));

const mockItemArroz = {
  produto: {
    id: 'p1',
    nome: 'Arroz',
    categoria: 'Grãos',
    unidade: 'kg',
    quantidadeAtual: milesimos(2000),
    quantidadeNecessaria: milesimos(2000),
  },
  estado: 'ok' as const,
  fracao: 1,
  temSobra: false,
  rotulo: 'Cheio',
};

jest.mock('@/application/estoque/use-produtos', () => ({
  useProdutos: () => ({ itens: [mockItemArroz], carregando: false }),
}));

jest.mock('@/application/estoque/use-categorias', () => ({ useCategorias: () => [] }));
jest.mock('@/application/estoque/use-dar-baixa', () => ({ useDarBaixa: () => ({ registrar: jest.fn() }) }));
jest.mock('@/application/estoque/use-repor-pontual', () => ({ useReporPontual: () => ({ registrar: jest.fn() }) }));
jest.mock('@/application/estoque/use-desfazer-movimento', () => ({ useDesfazerMovimento: () => ({ desfazer: jest.fn() }) }));

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('Despensa — rótulo acessível do stepper de consumo', () => {
  // ACHADO-061: o rótulo falado precisa usar o mesmo verbo do botão visível
  // e do toast ("Usei"), nunca o jargão de sistema "Registrar consumo".
  it('botão de decremento anuncia "Usei 1 kg de Arroz", não "Registrar consumo"', async () => {
    await comTema(<Despensa />);
    expect(screen.getByLabelText('Usei 1 kg de Arroz')).toBeTruthy();
    expect(screen.queryByLabelText(/Registrar consumo/)).toBeNull();
  });
});

describe('Despensa — busca não persiste teclado/foco entre abas', () => {
  beforeEach(() => {
    mockUltimoEfeito = null;
    jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('busca vazia e aberta fecha o campo e dispensa o teclado ao trocar de aba', async () => {
    await comTema(<Despensa />);
    fireEvent.press(screen.getByLabelText('Buscar'));
    await waitFor(() => expect(screen.getByPlaceholderText('Nome do item')).toBeTruthy());

    dispararBlur();

    await waitFor(() => expect(screen.queryByPlaceholderText('Nome do item')).toBeNull());
    expect(Keyboard.dismiss).toHaveBeenCalled();
  });

  it('busca com texto permanece aberta e filtrada ao trocar de aba, só dispensando o teclado', async () => {
    await comTema(<Despensa />);
    fireEvent.press(screen.getByLabelText('Buscar'));
    await waitFor(() => expect(screen.getByPlaceholderText('Nome do item')).toBeTruthy());
    fireEvent.changeText(screen.getByPlaceholderText('Nome do item'), 'roz');
    await waitFor(() => expect(screen.getByPlaceholderText('Nome do item')).toHaveDisplayValue('roz'));

    dispararBlur();

    await waitFor(() => expect(Keyboard.dismiss).toHaveBeenCalled());
    expect(screen.getByPlaceholderText('Nome do item')).toHaveDisplayValue('roz');
    expect(screen.getByLabelText('Usei 1 kg de Arroz')).toBeTruthy();
  });

  it('montagem inicial da tela não fecha uma busca recém-aberta sem uma troca de aba real', async () => {
    await comTema(<Despensa />);
    fireEvent.press(screen.getByLabelText('Buscar'));

    await waitFor(() => expect(screen.getByPlaceholderText('Nome do item')).toBeTruthy());
    expect(Keyboard.dismiss).not.toHaveBeenCalled();
  });

  it('volta pra despensa depois de um blur com busca preenchida já mostra a lista filtrada, sem redigitar', async () => {
    await comTema(<Despensa />);
    fireEvent.press(screen.getByLabelText('Buscar'));
    await waitFor(() => expect(screen.getByPlaceholderText('Nome do item')).toBeTruthy());
    fireEvent.changeText(screen.getByPlaceholderText('Nome do item'), 'roz');
    await waitFor(() => expect(screen.getByPlaceholderText('Nome do item')).toHaveDisplayValue('roz'));

    dispararBlur();

    await waitFor(() => expect(Keyboard.dismiss).toHaveBeenCalled());
    expect(screen.getByPlaceholderText('Nome do item')).toHaveDisplayValue('roz');
    expect(screen.getByLabelText('Usei 1 kg de Arroz')).toBeTruthy();
  });
});
