import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { ALVO_TOQUE_MINIMO } from '../theme/espaco';
import { ThemeProvider } from '../theme/provider';
import { FormularioProduto, VALORES_INICIAIS } from './formulario-produto';

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
