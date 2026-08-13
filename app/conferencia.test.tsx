import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { milesimos } from '@/domain/shared/quantidade';
import { ThemeProvider } from '@/presentation/theme/provider';
import Conferencia from './conferencia';

const mockBack = jest.fn();
const mockConfirmar = jest.fn().mockResolvedValue(undefined);
const mockCorrigir = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-router', () => ({
  router: { back: () => mockBack() },
  useRouter: () => ({ back: mockBack }),
}));

const itemAtualPadrao = {
  id: 'p1',
  nome: 'Arroz',
  categoria: 'Grãos',
  unidade: 'kg',
  quantidadeAtual: milesimos(2000),
};

// Estado mutável lido a cada render — permite reconfigurar o hook por teste
// (task 2.7) sem recorrer a `resetModules`/`doMock` (padrão já usado em
// `resumo.test.tsx` com `mockItens`).
let mockEstado: {
  categoriaEscolhida: string | null;
  itens: (typeof itemAtualPadrao)[];
  indice: number;
  itemAtual: typeof itemAtualPadrao | null;
  concluida: boolean;
  resumo: { corretos: number; corrigidos: number } | null;
} = {
  categoriaEscolhida: 'Grãos',
  itens: [itemAtualPadrao],
  indice: 0,
  itemAtual: itemAtualPadrao,
  concluida: false,
  resumo: null,
};

jest.mock('@/application/estoque/use-conferencia', () => ({
  CONFERENCIA_TUDO: '__TUDO__',
  useConferencia: () => ({
    carregando: false,
    categorias: ['Grãos'],
    categoriaEscolhida: mockEstado.categoriaEscolhida,
    itens: mockEstado.itens,
    indice: mockEstado.indice,
    itemAtual: mockEstado.itemAtual,
    concluida: mockEstado.concluida,
    resumo: mockEstado.resumo,
    escolherCategoria: jest.fn(),
    confirmar: mockConfirmar,
    corrigir: mockCorrigir,
  }),
}));

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('Conferencia — item atual', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockConfirmar.mockClear();
    mockCorrigir.mockClear();
    mockEstado = {
      categoriaEscolhida: 'Grãos',
      itens: [itemAtualPadrao],
      indice: 0,
      itemAtual: itemAtualPadrao,
      concluida: false,
      resumo: null,
    };
  });

  // Cenário exato do ACHADO-062: a tela do item era a única sem saída visível.
  it('exibe um botão "Voltar" acessível e o toque chama router.back()', async () => {
    await comTema(<Conferencia />);
    const botaoVoltar = screen.getByLabelText('Voltar');
    expect(botaoVoltar).toBeTruthy();
    fireEvent.press(botaoVoltar);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  // ACHADO-055: sem valor digitado, "Corrigir" precisa ser perceptivelmente
  // desabilitado, não um no-op silencioso.
  it('sem valor digitado, o botão "Corrigir" fica desabilitado e o toque não grava nada', async () => {
    await comTema(<Conferencia />);
    const botaoCorrigir = screen.getByRole('button', { name: 'Corrigir' });
    expect(botaoCorrigir.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(botaoCorrigir);
    expect(mockCorrigir).not.toHaveBeenCalled();
  });

  it('com valor digitado, o botão "Corrigir" habilita e o toque grava a correção', async () => {
    await comTema(<Conferencia />);
    const campo = screen.getByLabelText('Corrigir para');
    fireEvent.changeText(campo, '3,5');
    await waitFor(() => expect(campo.props.value).toBe('3,5'));

    const botaoCorrigir = screen.getByRole('button', { name: 'Corrigir' });
    expect(botaoCorrigir.props.accessibilityState.disabled).toBe(false);
    fireEvent.press(botaoCorrigir);
    await waitFor(() => expect(mockCorrigir).toHaveBeenCalledTimes(1));
  });

  it('sair pelo Voltar não grava nenhum movimento (não chama confirmar/corrigir)', async () => {
    await comTema(<Conferencia />);
    fireEvent.press(screen.getByLabelText('Voltar'));
    expect(mockConfirmar).not.toHaveBeenCalled();
    expect(mockCorrigir).not.toHaveBeenCalled();
  });

  // Task 2.1: o progresso "N de M" está visível durante o percurso.
  it('exibe o progresso "N de M conferidos" durante o percurso', async () => {
    await comTema(<Conferencia />);
    expect(screen.getByText('1 de 1 conferidos')).toBeTruthy();
  });

  // Task 2.2: confirmar a quantidade correta exige um único toque, sem diálogo.
  it('confirmar a quantidade correta grava com um único toque, sem diálogo', async () => {
    await comTema(<Conferencia />);
    fireEvent.press(screen.getByText('Confirmar — está certo'));
    await waitFor(() => expect(mockConfirmar).toHaveBeenCalledTimes(1));
    expect(mockCorrigir).not.toHaveBeenCalled();
  });

  // Task 2.3: informar uma correção grava o ajuste e avança, sem diálogo extra.
  it('informar uma correção grava o ajuste e avança, sem diálogo de confirmação', async () => {
    await comTema(<Conferencia />);
    fireEvent.changeText(screen.getByLabelText('Corrigir para'), '1,5');
    await waitFor(() => expect(screen.getByLabelText('Corrigir para').props.value).toBe('1,5'));
    fireEvent.press(screen.getByRole('button', { name: 'Corrigir' }));
    await waitFor(() => expect(mockCorrigir).toHaveBeenCalledTimes(1));
    expect(mockConfirmar).not.toHaveBeenCalled();
  });
});

describe('Conferencia — conclusão da categoria (ACHADO-042, task 2.7)', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockEstado = {
      categoriaEscolhida: 'Grãos',
      itens: [],
      indice: 0,
      itemAtual: null,
      concluida: true,
      resumo: { corretos: 4, corrigidos: 2 },
    };
  });

  it('categoria já totalmente conferida exibe quantos corrigidos e quantos corretos', async () => {
    await comTema(<Conferencia />);
    expect(
      screen.getByText('Conferência concluída: 4 estavam certos, 2 foram corrigidos.'),
    ).toBeTruthy();
  });

  it('a ação "Voltar para a despensa" da tela de conclusão chama router.back()', async () => {
    await comTema(<Conferencia />);
    fireEvent.press(screen.getByText('Voltar para a despensa'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
