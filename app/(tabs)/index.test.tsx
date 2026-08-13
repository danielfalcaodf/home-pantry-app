import { render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { View as MockView } from 'react-native';

import { milesimos } from '@/domain/shared/quantidade';
import { ThemeProvider } from '@/presentation/theme/provider';
import Despensa from './index';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => ({}),
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
