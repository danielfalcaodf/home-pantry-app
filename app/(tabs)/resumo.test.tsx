import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { ALVO_TOQUE_MINIMO } from '@/presentation/theme/espaco';
import { ThemeProvider } from '@/presentation/theme/provider';
import Resumo from './resumo';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a) },
}));

function estiloResolvido(elemento: { props: { style?: unknown } }) {
  const { style } = elemento.props;
  return Array.isArray(style) ? Object.assign({}, ...style) : style;
}

type ItemFake = { produto: { id: string; nome: string; categoria: string | null }; estado: 'critico' | 'emFalta' | 'ok' };

function itensDe(criticos: number, emFalta: number, ok: number): ItemFake[] {
  const itens: ItemFake[] = [];
  for (let i = 0; i < criticos; i++) {
    itens.push({ produto: { id: `c${i}`, nome: `Crítico ${i}`, categoria: null }, estado: 'critico' });
  }
  for (let i = 0; i < emFalta; i++) {
    itens.push({ produto: { id: `f${i}`, nome: `Falta ${i}`, categoria: null }, estado: 'emFalta' });
  }
  for (let i = 0; i < ok; i++) {
    itens.push({ produto: { id: `o${i}`, nome: `Ok ${i}`, categoria: null }, estado: 'ok' });
  }
  return itens;
}

let mockItens: ItemFake[] = [];

let mockMeses: { mes: string; totalPago: number; qtdCompras: number }[] = [
  { mes: '2026-08', totalPago: 0, qtdCompras: 0 },
];

jest.mock('@/application/resumo/use-gasto-mensal', () => ({
  useGastoMensal: () => ({
    carregando: false,
    get meses() {
      return mockMeses;
    },
  }),
}));

let mockResumoValores = {
  carregando: false,
  valorDoEstoque: 0,
  contagemSemPrecoEstoque: 0,
  valorDaLista: 0,
  contagemSemPrecoLista: 0,
  contagensPorEstado: { critico: 0, emFalta: 0, ok: 0 },
};

jest.mock('@/application/resumo/use-resumo-valores', () => ({
  useResumoDeValores: () => ({
    ...mockResumoValores,
    get itensDaDespensaPorEstado() {
      return mockItens;
    },
  }),
}));

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

describe('Resumo — chip "Faltando"', () => {
  // Cenário exato do ACHADO-053: 37 itens zerados (critico), 0 emFalta.
  it('soma critico + emFalta, igual à Despensa, quando emFalta é zero', async () => {
    mockItens = itensDe(37, 0, 4);
    await comTema(<Resumo />);
    expect(screen.getByLabelText('Faltando, 37')).toBeTruthy();
  });

  it.each([
    [0, 12, 12],
    [3, 12, 15],
    [0, 0, 0],
  ])('critico=%i, emFalta=%i → chip Faltando exibe %i', async (critico, emFalta, esperado) => {
    mockItens = itensDe(critico, emFalta, 1);
    await comTema(<Resumo />);
    expect(screen.getByLabelText(`Faltando, ${esperado}`)).toBeTruthy();
  });

  it('chip "Acabou" continua mostrando só critico, e "Cheio" só ok', async () => {
    mockItens = itensDe(5, 2, 9);
    await comTema(<Resumo />);
    expect(screen.getByLabelText('Acabou, 5')).toBeTruthy();
    expect(screen.getByLabelText('Cheio, 9')).toBeTruthy();
  });
});

describe('Resumo — botão "Configurações"', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockItens = itensDe(1, 0, 1);
  });

  // ACHADO-058 (task 2.2): alvo de toque precisa medir ≥48dp de altura.
  it('mede ao menos 48dp de altura tocável', async () => {
    await comTema(<Resumo />);
    const botao = screen.getByLabelText('Configurações');
    expect(estiloResolvido(botao).minHeight).toBeGreaterThanOrEqual(ALVO_TOQUE_MINIMO);
  });

  // (task 2.3): o toque continua navegando para /configuracoes.
  it('tocar continua navegando para /configuracoes', async () => {
    await comTema(<Resumo />);
    fireEvent.press(screen.getByLabelText('Configurações'));
    expect(mockPush).toHaveBeenCalledWith('/configuracoes');
  });
});

describe('Resumo — estado vazio do gasto mensal (ACHADO-045, task 3.1)', () => {
  beforeEach(() => {
    mockItens = itensDe(1, 0, 1);
  });

  it('sem nenhuma compra fechada, exibe o convite exato em vez do mini gráfico', async () => {
    mockMeses = [
      { mes: '2026-08', totalPago: 0, qtdCompras: 0 },
      { mes: '2026-07', totalPago: 0, qtdCompras: 0 },
    ];
    await comTema(<Resumo />);
    expect(
      screen.getByText(
        'Nenhuma compra fechada ainda. Assim que você fechar a primeira, o gasto do mês aparece aqui.',
      ),
    ).toBeTruthy();
  });

  it('com ao menos uma compra fechada, não exibe o convite de estado vazio', async () => {
    mockMeses = [{ mes: '2026-08', totalPago: 1000, qtdCompras: 1 }];
    await comTema(<Resumo />);
    expect(
      screen.queryByText(
        'Nenhuma compra fechada ainda. Assim que você fechar a primeira, o gasto do mês aparece aqui.',
      ),
    ).toBeNull();
  });
});

describe('Resumo — navegação por contagem de estado (ACHADO-045, task 3.2)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockItens = itensDe(3, 2, 5);
    mockMeses = [{ mes: '2026-08', totalPago: 1000, qtdCompras: 1 }];
  });

  it('tocar em "Acabou" navega para a despensa filtrada por críticos', async () => {
    await comTema(<Resumo />);
    fireEvent.press(screen.getByLabelText('Acabou, 3'));
    expect(mockPush).toHaveBeenCalledWith('/?filtro=critico');
  });

  it('tocar em "Faltando" navega para a despensa filtrada por faltando', async () => {
    await comTema(<Resumo />);
    fireEvent.press(screen.getByLabelText('Faltando, 5'));
    expect(mockPush).toHaveBeenCalledWith('/?filtro=faltando');
  });

  it('tocar em "Cheio" navega para a despensa filtrada por ok', async () => {
    await comTema(<Resumo />);
    fireEvent.press(screen.getByLabelText('Cheio, 5'));
    expect(mockPush).toHaveBeenCalledWith('/?filtro=ok');
  });
});

describe('Resumo — aviso de valor parcial (ACHADO-045, task 3.3)', () => {
  beforeEach(() => {
    mockMeses = [{ mes: '2026-08', totalPago: 0, qtdCompras: 0 }];
  });

  it('com itens sem preço no estoque, exibe o aviso de valor parcial', async () => {
    mockItens = itensDe(1, 0, 1);
    mockResumoValores = {
      carregando: false,
      valorDoEstoque: 1000,
      contagemSemPrecoEstoque: 2,
      valorDaLista: 0,
      contagemSemPrecoLista: 0,
      contagensPorEstado: { critico: 0, emFalta: 0, ok: 0 },
    };
    await comTema(<Resumo />);
    expect(screen.getByText(/2 itens sem preço — valor\s*parcial/)).toBeTruthy();
  });

  it('sem itens sem preço, não exibe o aviso de valor parcial', async () => {
    mockItens = itensDe(1, 0, 1);
    mockResumoValores = {
      carregando: false,
      valorDoEstoque: 1000,
      contagemSemPrecoEstoque: 0,
      valorDaLista: 0,
      contagemSemPrecoLista: 0,
      contagensPorEstado: { critico: 0, emFalta: 0, ok: 0 },
    };
    await comTema(<Resumo />);
    expect(screen.queryByText(/item[s]? sem preço/)).toBeNull();
  });
});

describe('Resumo — mini gráfico dos últimos 4 meses (ACHADO-052, tasks 7.4/7.5)', () => {
  beforeEach(() => {
    mockItens = itensDe(1, 0, 1);
  });

  // Task 7.4: com 6 meses agregados, o gráfico recebe exatamente os 4 mais
  // recentes, em ordem cronológica ascendente (mais antigo à esquerda).
  it('com 6 meses de gasto, o gráfico exibe exatamente os 4 mais recentes em ordem ascendente', async () => {
    // gastoMensal.meses vem do mais recente para o mais antigo (mesma ordem
    // da lista "Gasto por mês" logo abaixo do gráfico).
    mockMeses = [
      { mes: '2026-08', totalPago: 100, qtdCompras: 1 },
      { mes: '2026-07', totalPago: 200, qtdCompras: 1 },
      { mes: '2026-06', totalPago: 300, qtdCompras: 1 },
      { mes: '2026-05', totalPago: 400, qtdCompras: 1 },
      { mes: '2026-04', totalPago: 500, qtdCompras: 1 },
      { mes: '2026-03', totalPago: 600, qtdCompras: 1 },
    ];
    await comTema(<Resumo />);
    // Rótulos curtos (3 letras) na ordem ascendente esperada: mai, jun, jul, ago.
    const elementos = screen.getAllByText(/^(Mai|Jun|Jul|Ago)$/);
    expect(elementos.map((elemento) => elemento.props.children)).toEqual(['Mai', 'Jun', 'Jul', 'Ago']);
    expect(screen.queryByText('Mar')).toBeNull();
    expect(screen.queryByText('Abr')).toBeNull();
  });

  // Task 7.5: com só 2 meses disponíveis, o gráfico exibe os 2, na mesma
  // ordem ascendente, sem estourar índice.
  it('com apenas 2 meses de gasto, o gráfico exibe os 2 existentes, sem erro de índice', async () => {
    mockMeses = [
      { mes: '2026-08', totalPago: 100, qtdCompras: 1 },
      { mes: '2026-07', totalPago: 200, qtdCompras: 1 },
    ];
    await comTema(<Resumo />);
    expect(screen.getByText('Jul')).toBeTruthy();
    expect(screen.getByText('Ago')).toBeTruthy();
  });
});
