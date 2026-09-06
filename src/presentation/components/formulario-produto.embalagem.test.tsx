import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ReactNode, useState } from 'react';

import { ThemeProvider } from '../theme/provider';
import { FormularioProduto, ValoresDoProduto, VALORES_INICIAIS } from './formulario-produto';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

async function comTema(no: ReactNode) {
  return await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

function FormularioControlado({
  categoriasExistentes,
  valoresIniciais = VALORES_INICIAIS,
}: {
  categoriasExistentes: string[];
  valoresIniciais?: ValoresDoProduto;
}) {
  const [valores, setValores] = useState(valoresIniciais);
  return (
    <FormularioProduto
      valores={valores}
      aoMudar={setValores}
      erros={{}}
      categoriasExistentes={categoriasExistentes}
      tituloAcao="Salvar"
      aoSalvar={() => {}}
    />
  );
}

describe('FormularioProduto — controle "Vem em pacote fechado?" (change conversao-unidade-de-compra)', () => {
  it('default "Não": só "Quanto costuma custar" aparece para unidade indivisível', async () => {
    await comTema(
      <FormularioControlado
        categoriasExistentes={[]}
        valoresIniciais={{ ...VALORES_INICIAIS, unidade: 'un' }}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));

    await waitFor(() => expect(screen.getByLabelText('Quanto costuma custar')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Não' })).toBeTruthy();
    expect(screen.queryByLabelText('Quantas unidades vêm no pacote?')).toBeNull();
    expect(screen.queryByLabelText('Quanto custa o pacote?')).toBeNull();
  });

  it('controle ausente para unidade divisível (sem pergunta de pacote no olhômetro)', async () => {
    await comTema(
      <FormularioControlado
        categoriasExistentes={[]}
        valoresIniciais={{ ...VALORES_INICIAIS, unidade: 'kg' }}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));

    await waitFor(() => expect(screen.getByLabelText('Quanto costuma custar')).toBeTruthy());
    expect(screen.queryByText('Vem em pacote fechado?')).toBeNull();
    expect(screen.queryByLabelText('Quantas unidades vêm no pacote?')).toBeNull();
  });

  it('unidade "pacote" vai direto aos campos de embalagem, sem o controle nem o preço direto', async () => {
    await comTema(
      <FormularioControlado
        categoriasExistentes={[]}
        valoresIniciais={{ ...VALORES_INICIAIS, unidade: 'pacote' }}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));

    await waitFor(() => expect(screen.getByLabelText('Quantas unidades vêm no pacote?')).toBeTruthy());
    expect(screen.getByLabelText('Quanto custa o pacote?')).toBeTruthy();
    expect(screen.queryByText('Vem em pacote fechado?')).toBeNull();
    expect(screen.queryByLabelText('Quanto costuma custar')).toBeNull();
  });

  it('unidade "caixa" vai direto aos campos de embalagem, sem o controle nem o preço direto', async () => {
    await comTema(
      <FormularioControlado
        categoriasExistentes={[]}
        valoresIniciais={{ ...VALORES_INICIAIS, unidade: 'caixa' }}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));

    await waitFor(() => expect(screen.getByLabelText('Quantas unidades vêm no pacote?')).toBeTruthy());
    expect(screen.getByLabelText('Quanto custa o pacote?')).toBeTruthy();
    expect(screen.queryByText('Vem em pacote fechado?')).toBeNull();
    expect(screen.queryByLabelText('Quanto costuma custar')).toBeNull();
  });

  it('alternar para "Sim" esconde o preço direto e mostra os dois campos de pacote', async () => {
    await comTema(
      <FormularioControlado
        categoriasExistentes={[]}
        valoresIniciais={{ ...VALORES_INICIAIS, unidade: 'un' }}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sim' })).toBeTruthy());

    fireEvent.press(screen.getByRole('button', { name: 'Sim' }));

    await waitFor(() => expect(screen.queryByLabelText('Quanto costuma custar')).toBeNull());
    expect(screen.getByLabelText('Quantas unidades vêm no pacote?')).toBeTruthy();
    expect(screen.getByLabelText('Quanto custa o pacote?')).toBeTruthy();
  });

  it('"Não" a partir de um produto com fator já cadastrado descarta a embalagem e retoma o preço direto', async () => {
    await comTema(
      <FormularioControlado
        categoriasExistentes={[]}
        valoresIniciais={{
          ...VALORES_INICIAIS,
          unidade: 'un',
          fatorConversaoEmbalagem: '12',
          valorReferenciaEmbalagem: '12,90',
        }}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Sim' }).props.accessibilityState.selected).toBe(true),
    );

    fireEvent.press(screen.getByRole('button', { name: 'Não' }));

    await waitFor(() => expect(screen.getByLabelText('Quanto costuma custar')).toBeTruthy());
    expect(screen.queryByLabelText('Quantas unidades vêm no pacote?')).toBeNull();
    expect(screen.queryByLabelText('Quanto custa o pacote?')).toBeNull();
  });

  it('trocar unidade para divisível descarta controle e valores de embalagem já digitados', async () => {
    await comTema(
      <FormularioControlado
        categoriasExistentes={[]}
        valoresIniciais={{
          ...VALORES_INICIAIS,
          unidade: 'un',
          fatorConversaoEmbalagem: '12',
          valorReferenciaEmbalagem: '12,90',
        }}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Quantas unidades vêm no pacote?').props.value).toBe('12'),
    );

    fireEvent.press(screen.getByText('kg'));

    await waitFor(() => expect(screen.queryByLabelText('Quantas unidades vêm no pacote?')).toBeNull());
    expect(screen.queryByText('Vem em pacote fechado?')).toBeNull();

    fireEvent.press(screen.getByText('un'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Não' })).toBeTruthy());
    expect(screen.getByLabelText('Quanto costuma custar')).toBeTruthy();
    expect(screen.queryByLabelText('Quantas unidades vêm no pacote?')).toBeNull();
  });

  it('ir de "un" com fator para "pacote" e voltar mantém a embalagem visível (sem preço direto)', async () => {
    await comTema(
      <FormularioControlado
        categoriasExistentes={[]}
        valoresIniciais={{
          ...VALORES_INICIAIS,
          unidade: 'un',
          fatorConversaoEmbalagem: '12',
          valorReferenciaEmbalagem: '12,90',
        }}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Quantas unidades vêm no pacote?').props.value).toBe('12'),
    );

    fireEvent.press(screen.getByText('pacote'));
    await waitFor(() => expect(screen.queryByText('Vem em pacote fechado?')).toBeNull());
    expect(screen.getByLabelText('Quantas unidades vêm no pacote?').props.value).toBe('12');

    fireEvent.press(screen.getByText('un'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Sim' }).props.accessibilityState.selected).toBe(true),
    );
    expect(screen.getByLabelText('Quantas unidades vêm no pacote?').props.value).toBe('12');
    expect(screen.queryByLabelText('Quanto costuma custar')).toBeNull();
  });

  it('produto sem fator permanece com o formulário de hoje (ex.: sabonete)', async () => {
    await comTema(
      <FormularioControlado
        categoriasExistentes={[]}
        valoresIniciais={{ ...VALORES_INICIAIS, unidade: 'un', valorUnitario: '4,50' }}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));

    await waitFor(() => expect(screen.getByLabelText('Quanto costuma custar').props.value).toBe('4,50'));
    expect(screen.getByRole('button', { name: 'Não' }).props.accessibilityState.selected).toBe(true);
  });
});
