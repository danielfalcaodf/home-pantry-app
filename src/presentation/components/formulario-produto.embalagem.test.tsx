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

function FormularioQueGuarda({ valoresIniciais, guardar }: { valoresIniciais: ValoresDoProduto; guardar: (v: ValoresDoProduto) => void }) {
  const [valores, setValores] = useState(valoresIniciais);
  return (
    <FormularioProduto
      valores={valores}
      aoMudar={(novos) => {
        setValores(novos);
        guardar(novos);
      }}
      erros={{}}
      categoriasExistentes={[]}
      tituloAcao="Salvar"
      aoSalvar={() => {}}
    />
  );
}

describe('FormularioProduto — unidades un/kg e base de preço (correcao-unidades-un-kg-preco)', () => {
  it('seletor de medida oferece só un e kg', async () => {
    await comTema(<FormularioControlado categoriasExistentes={[]} />);
    expect(screen.getByRole('button', { name: 'un' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'kg' })).toBeTruthy();
    for (const removida of ['g', 'ml', 'L', 'pacote', 'caixa']) {
      expect(screen.queryByRole('button', { name: removida })).toBeNull();
    }
  });

  it('controle de pacote em un traz o exemplo do papel higiênico', async () => {
    await comTema(
      <FormularioControlado categoriasExistentes={[]} valoresIniciais={{ ...VALORES_INICIAIS, unidade: 'un' }} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));

    await waitFor(() => expect(screen.getByText('É vendido em pacote fechado?')).toBeTruthy());
    expect(screen.getByText('ex.: papel higiênico em pacote de 12 rolos')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'por 100 g' })).toBeNull();
  });

  it('base "por kg · por 100 g" só em kg, com "por kg" como padrão', async () => {
    const guardar = jest.fn();
    await comTema(
      <FormularioQueGuarda valoresIniciais={{ ...VALORES_INICIAIS, unidade: 'kg' }} guardar={guardar} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'por kg' }).props.accessibilityState.selected).toBe(true),
    );
    expect(screen.queryByText('É vendido em pacote fechado?')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'por 100 g' }));
    expect(guardar).toHaveBeenLastCalledWith(expect.objectContaining({ basePreco: '100g' }));

    await fireEvent.press(screen.getByRole('button', { name: 'un' }));
    expect(guardar).toHaveBeenLastCalledWith(expect.objectContaining({ unidade: 'un', basePreco: 'kg' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'por 100 g' })).toBeNull());
  });
});

describe('FormularioProduto — controle "É vendido em pacote fechado?" (change conversao-unidade-de-compra)', () => {
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
    expect(screen.queryByText('É vendido em pacote fechado?')).toBeNull();
    expect(screen.queryByLabelText('Quantas unidades vêm no pacote?')).toBeNull();
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
    expect(screen.queryByText('É vendido em pacote fechado?')).toBeNull();

    fireEvent.press(screen.getByText('un'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Não' })).toBeTruthy());
    expect(screen.getByLabelText('Quanto costuma custar')).toBeTruthy();
    expect(screen.queryByLabelText('Quantas unidades vêm no pacote?')).toBeNull();
  });

  it('produto sem fator permanece com o formulário de hoje (ex.: sabonete)', async () => {
    await comTema(
      <FormularioControlado
        categoriasExistentes={[]}
        valoresIniciais={{ ...VALORES_INICIAIS, unidade: 'un', valorUnitario: '4,50' }}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));

    await waitFor(() => expect(screen.getByLabelText('Quanto costuma custar').props.accessibilityValue.text).toBe('R$ 4,50'));
    expect(screen.getByRole('button', { name: 'Não' }).props.accessibilityState.selected).toBe(true);
  });
});
