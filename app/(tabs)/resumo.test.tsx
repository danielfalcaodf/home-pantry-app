import { render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { ThemeProvider } from '@/presentation/theme/provider';
import Resumo from './resumo';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

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

jest.mock('@/application/resumo/use-resumo-valores', () => ({
  useResumoDeValores: () => ({
    carregando: false,
    valorDoEstoque: 0,
    contagemSemPrecoEstoque: 0,
    valorDaLista: 0,
    contagemSemPrecoLista: 0,
    contagensPorEstado: { critico: 0, emFalta: 0, ok: 0 },
    get itensDaDespensaPorEstado() {
      return mockItens;
    },
  }),
}));

jest.mock('@/application/resumo/use-gasto-mensal', () => ({
  useGastoMensal: () => ({ carregando: false, meses: [{ mes: '2026-08', totalPago: 0, qtdCompras: 0 }] }),
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
