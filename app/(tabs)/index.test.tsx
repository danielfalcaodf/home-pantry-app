import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Keyboard, View as MockView } from 'react-native';

import { useAvisoCompraStore } from '@/application/compra/aviso-compra-store';
import { milesimos } from '@/domain/shared/quantidade';
import { ThemeProvider } from '@/presentation/theme/provider';
import Despensa from './index';

// `mockEfeitoAtual`/`mockCleanupAtual` replicam a semântica real do
// `useFocusEffect` do react-navigation: ele é um `useEffect(fn, [navigation,
// efeito])` por baixo — toda vez que a *identidade* do `efeito` muda (ex.:
// um `useCallback` com dependência que muda a cada tecla), o React desmonta
// o efeito anterior (chamando seu cleanup) e, como a tela continua focada,
// remonta na hora. É esse desmonte/remonte por troca de dependência — não
// só a troca de aba real — que caracteriza o bug ACHADO-062 (teclado fecha
// a cada tecla). Sem essa simulação, o teste não pega a regressão. Prefixo
// `mock` é o que o babel-plugin-jest-hoist exige pra permitir referenciar a
// variável de dentro da factory de `jest.mock`, hoisted acima deste import.
let mockEfeitoAtual: (() => void | (() => void)) | null = null;
let mockCleanupAtual: (() => void) | undefined;

// Chama direto, sem embrulhar num `act()` síncrono: o `autoFocus` do campo
// de busca deixa um `act()` assíncrono pendente sob RNTL, e sincronizar
// manualmente com ele se mostrou instável (a atualização de estado do
// cleanup corria risco de nunca comitar a tempo). As asserções depois de
// `dispararBlur()` usam `waitFor`, que já resolve o commit real assim que
// ele acontece. Simula um evento de blur real da navegação (troca de aba):
// só chama o cleanup do efeito já registrado, sem trocar sua identidade —
// diferente da troca de dependência, que o mock de `useFocusEffect` abaixo
// já trata sozinho a cada render.
function dispararBlur() {
  mockCleanupAtual?.();
}

const mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => mockParams,
  useFocusEffect: (efeito: () => void | (() => void)) => {
    if (efeito !== mockEfeitoAtual) {
      mockCleanupAtual?.();
      mockEfeitoAtual = efeito;
      const destruir = efeito();
      mockCleanupAtual = typeof destruir === 'function' ? destruir : undefined;
    }
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

describe('Despensa — aviso de compra fechada (achado de QA)', () => {
  afterEach(() => {
    useAvisoCompraStore.getState().limpar();
  });

  // Achado de QA: fechar a compra navegava direto pra cá sem mostrar
  // nenhum aviso — a notificação "Você repôs N itens" nunca aparecia.
  // Tentativa inicial via parâmetro de rota (`?avisoCompra=`) não chegava:
  // esta aba já costuma estar montada, então `useLocalSearchParams` não
  // reage à navegação vinda de fora do grupo de abas. A mensagem viaja
  // pela store global (`useAvisoCompraStore`) em vez disso.
  it('mostra o toast de "Você repôs N itens" recebido da tela de Compra e depois limpa a store', async () => {
    useAvisoCompraStore.getState().definir('Você repôs 2 itens');
    await comTema(<Despensa />);

    const toast = await screen.findByText('Você repôs 2 itens');
    expect(toast).toBeTruthy();

    fireEvent(toast, 'onFim');
    expect(useAvisoCompraStore.getState().mensagem).toBeNull();
  });

  it('sem mensagem na store, não mostra nenhum toast de compra', async () => {
    await comTema(<Despensa />);

    expect(screen.queryByText(/Você repôs/)).toBeNull();
  });
});

describe('Despensa — busca não persiste teclado/foco entre abas', () => {
  beforeEach(() => {
    mockEfeitoAtual = null;
    mockCleanupAtual = undefined;
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

describe('Despensa — ACHADO-062: digitar na busca não fecha o teclado sozinho', () => {
  // Bug confirmado em aparelho físico (2026-08-21, tasks.md §6): a cada
  // tecla, `busca` mudava e o `useCallback` do `useFocusEffect` ganhava
  // nova identidade — o react-navigation trata isso como se a tela tivesse
  // perdido o foco, disparando o cleanup (`Keyboard.dismiss`) a cada
  // caractere. Correção: `busca` lido via ref dentro do cleanup, callback
  // com deps `[]` (identidade estável entre teclas).
  beforeEach(() => {
    mockEfeitoAtual = null;
    mockCleanupAtual = undefined;
    jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('digitar um caractere no campo de busca não chama Keyboard.dismiss', async () => {
    await comTema(<Despensa />);
    fireEvent.press(screen.getByLabelText('Buscar'));
    await waitFor(() => expect(screen.getByPlaceholderText('Nome do item')).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText('Nome do item'), 'r');
    await waitFor(() => expect(screen.getByPlaceholderText('Nome do item')).toHaveDisplayValue('r'));

    expect(Keyboard.dismiss).not.toHaveBeenCalled();
  });

  it('digitar vários caracteres em sequência não fecha o teclado em nenhum momento', async () => {
    await comTema(<Despensa />);
    fireEvent.press(screen.getByLabelText('Buscar'));
    const campo = await screen.findByPlaceholderText('Nome do item');

    for (const parcial of ['r', 'ro', 'roz']) {
      fireEvent.changeText(campo, parcial);
      await waitFor(() => expect(campo).toHaveDisplayValue(parcial));
      expect(Keyboard.dismiss).not.toHaveBeenCalled();
    }
  });

  it('apagar caracteres (backspace) também não fecha o teclado', async () => {
    await comTema(<Despensa />);
    fireEvent.press(screen.getByLabelText('Buscar'));
    const campo = await screen.findByPlaceholderText('Nome do item');
    fireEvent.changeText(campo, 'roz');
    await waitFor(() => expect(campo).toHaveDisplayValue('roz'));

    fireEvent.changeText(campo, 'ro');
    await waitFor(() => expect(campo).toHaveDisplayValue('ro'));

    expect(Keyboard.dismiss).not.toHaveBeenCalled();
  });
});
