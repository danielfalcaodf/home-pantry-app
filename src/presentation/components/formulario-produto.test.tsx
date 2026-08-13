import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ReactNode, useState } from 'react';

import { ALVO_TOQUE_MINIMO } from '../theme/espaco';
import { ThemeProvider } from '../theme/provider';
import { FormularioProduto, ValoresDoProduto, VALORES_INICIAIS } from './formulario-produto';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

function estiloResolvido(elemento: { props: { style?: unknown } }) {
  const { style } = elemento.props;
  return Array.isArray(style) ? Object.assign({}, ...style) : style;
}

async function montarFormulario() {
  return comTema(
    <FormularioProduto
      valores={VALORES_INICIAIS}
      aoMudar={() => {}}
      erros={{}}
      categoriasExistentes={[]}
      tituloAcao="Salvar"
      aoSalvar={() => {}}
    />,
  );
}

/** Controlado de verdade — a filtragem de sugestão só se manifesta quando o
 *  `aoMudar` do chamador realimenta `valores`, como no cadastro/edição reais. */
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

describe('FormularioProduto — seção "mais opções" e autocomplete de categoria (ACHADO-022)', () => {
  it('"mais opções" fica recolhida na renderização inicial', async () => {
    await montarFormulario();
    expect(screen.getByText('Mais opções')).toBeTruthy();
    expect(screen.queryByLabelText('Quanto costuma custar')).toBeNull();
    expect(screen.queryByLabelText('Onde guardo')).toBeNull();
  });

  it('filtra as sugestões de categoria pelo texto digitado', async () => {
    await comTema(
      <FormularioControlado categoriasExistentes={['Mercearia', 'Limpeza', 'Higiene']} />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));
    await waitFor(() => expect(screen.getByLabelText('Onde guardo')).toBeTruthy());

    fireEvent.changeText(screen.getByLabelText('Onde guardo'), 'me');

    await waitFor(() => expect(screen.getByText('Mercearia')).toBeTruthy());
    expect(screen.queryByText('Limpeza')).toBeNull();
    expect(screen.queryByText('Higiene')).toBeNull();
  });

  it('escolher uma sugestão preenche o campo com o valor exato oferecido', async () => {
    await comTema(
      <FormularioControlado
        categoriasExistentes={['Mercearia']}
        valoresIniciais={{ ...VALORES_INICIAIS, categoria: 'me' }}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));
    await waitFor(() => expect(screen.getByText('Mercearia')).toBeTruthy());

    fireEvent.press(screen.getByText('Mercearia'));

    // Preenchimento exato: "me" digitado vira "Mercearia", sem variação de caixa/espaço.
    await waitFor(() => expect(screen.getByLabelText('Onde guardo').props.value).toBe('Mercearia'));
    // A sugestão de si mesma some depois de escolhida.
    expect(screen.queryByText('Mercearia')).toBeNull();
  });

  it('nenhuma sugestão corresponde ao texto digitado: lista vazia, sem erro', async () => {
    await comTema(
      <FormularioControlado
        categoriasExistentes={['Mercearia', 'Limpeza']}
        valoresIniciais={{ ...VALORES_INICIAIS, categoria: 'zzz' }}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));
    await waitFor(() => expect(screen.getByLabelText('Onde guardo')).toBeTruthy());

    expect(screen.queryByText('Mercearia')).toBeNull();
    expect(screen.queryByText('Limpeza')).toBeNull();
  });
});

describe('FormularioProduto — alvo de toque de "Mais opções" (ACHADO-063)', () => {
  it('"Mais opções" mede ao menos 48dp de altura tocável', async () => {
    await montarFormulario();
    const botao = screen.getByText('Mais opções');
    // O texto está dentro do Pressable estilizado — o estilo mora no pai.
    expect(estiloResolvido(botao.parent as never).minHeight).toBeGreaterThanOrEqual(ALVO_TOQUE_MINIMO);
  });

  it('tocar continua expandindo para "Menos opções", sem regressão de comportamento', async () => {
    await montarFormulario();
    fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));
    await waitFor(() => expect(screen.getByText('Menos opções')).toBeTruthy());
  });
});
