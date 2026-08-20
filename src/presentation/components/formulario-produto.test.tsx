import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { ReactNode, useState } from 'react';
import { ScrollView, View } from 'react-native';

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

  it('anuncia o estado expandido/colapsado, além do ícone visual (affordance)', async () => {
    await montarFormulario();
    const botao = screen.getByRole('button', { name: 'Mais opções' });
    expect(botao.props.accessibilityState?.expanded).toBe(false);

    fireEvent.press(botao);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Menos opções' }).props.accessibilityState?.expanded).toBe(
        true,
      ),
    );
  });
});

describe('FormularioProduto — campo em foco não fica coberto pelo teclado (Keyboard Overlap)', () => {
  it('o conteúdo do formulário está dentro de um KeyboardAvoidingView', async () => {
    await montarFormulario();
    // Reprodução estrutural do bug relatado: o campo "Quanto quero ter em
    // casa" e o botão "Salvar" ficavam atrás do teclado porque nada no
    // formulário compensava a abertura dele — agora o conteúdo inteiro
    // (incluindo o campo em foco e o botão de ação) vive dentro do
    // KeyboardAvoidingView de EvitaTeclado.
    const avoidingView = screen.getByTestId('evita-teclado-formulario');
    expect(within(avoidingView).getByLabelText('Quanto quero ter em casa')).toBeTruthy();
    expect(within(avoidingView).getByRole('button', { name: 'Salvar' })).toBeTruthy();
  });

  it('o wrapper de teclado também está presente no tema claro (Porcelana)', async () => {
    await render(
      <ThemeProvider preferencia="claro">
        <FormularioProduto
          valores={VALORES_INICIAIS}
          aoMudar={() => {}}
          erros={{}}
          categoriasExistentes={[]}
          tituloAcao="Salvar"
          aoSalvar={() => {}}
        />
      </ThemeProvider>,
    );

    const avoidingView = screen.getByTestId('evita-teclado-formulario');
    expect(within(avoidingView).getByLabelText('Quanto quero ter em casa')).toBeTruthy();
  });
});

describe('FormularioProduto — categoria sugere antes de digitar (affordance)', () => {
  it('mostra as categorias existentes ao focar o campo, antes de qualquer texto', async () => {
    await comTema(
      <FormularioControlado categoriasExistentes={['Mercearia', 'Limpeza', 'Higiene']} />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));
    await waitFor(() => expect(screen.getByLabelText('Onde guardo')).toBeTruthy());

    fireEvent(screen.getByLabelText('Onde guardo'), 'focus');

    await waitFor(() => expect(screen.getByText('Mercearia')).toBeTruthy());
    expect(screen.getByText('Limpeza')).toBeTruthy();
    expect(screen.getByText('Higiene')).toBeTruthy();
  });

  it('some com as sugestões ao perder o foco sem ter digitado nada', async () => {
    await comTema(
      <FormularioControlado categoriasExistentes={['Mercearia']} />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));
    await waitFor(() => expect(screen.getByLabelText('Onde guardo')).toBeTruthy());

    fireEvent(screen.getByLabelText('Onde guardo'), 'focus');
    await waitFor(() => expect(screen.getByText('Mercearia')).toBeTruthy());

    fireEvent(screen.getByLabelText('Onde guardo'), 'blur');
    await waitFor(() => expect(screen.queryByText('Mercearia')).toBeNull());
  });
});

describe('FormularioProduto — scroll ao expandir "Mais opções" (correcao-tela-editar-produto)', () => {
  /** O `measureLayout` real do RN não roda sob Jest (mock no-op) — aqui ele
   *  simula a posição do marcador que fica logo após "Mais opções", como a
   *  implementação faria de verdade via bridge nativa. */
  function mockPosicaoDoMarcador(y: number) {
    const alvo = View.prototype as unknown as {
      measureLayout: (...args: unknown[]) => void;
    };
    return jest.spyOn(alvo, 'measureLayout').mockImplementation((...args: unknown[]) => {
      const aoMedir = args[1] as (x: number, y: number, largura: number, altura: number) => void;
      aoMedir(0, y, 100, 20);
    });
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('ao ABRIR "Mais opções", rola até o marcador — sem focar nenhum campo revelado', async () => {
    mockPosicaoDoMarcador(240);
    const scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo').mockImplementation(() => {});
    await montarFormulario();

    fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));

    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ y: 240, animated: true }));
    // Sem foco automático (ACHADO-056): o campo revelado aparece, mas ninguém pediu foco nele.
    expect(screen.getByLabelText('Quanto costuma custar').props.autoFocus).toBeFalsy();
  });

  it('ao RECOLHER "Menos opções", não dispara scroll — só ao abrir', async () => {
    mockPosicaoDoMarcador(240);
    const scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo').mockImplementation(() => {});
    await montarFormulario();

    fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));
    await waitFor(() => expect(scrollTo).toHaveBeenCalledTimes(1));
    scrollTo.mockClear();

    fireEvent.press(screen.getByRole('button', { name: 'Menos opções' }));
    await waitFor(() => expect(screen.getByText('Mais opções')).toBeTruthy());

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
