import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { ThemeProvider } from '../theme/provider';
import { FormularioProduto, VALORES_INICIAIS } from './formulario-produto';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

function montarFormulario(props: { autofocarNome?: boolean } = {}) {
  return comTema(
    <FormularioProduto
      valores={VALORES_INICIAIS}
      aoMudar={() => {}}
      erros={{}}
      categoriasExistentes={[]}
      tituloAcao="Salvar"
      aoSalvar={() => {}}
      {...props}
    />,
  );
}

describe('FormularioProduto — foco automático (ACHADO-056)', () => {
  it('por padrão o campo de nome NÃO recebe foco automático', async () => {
    // É assim que o detalhe do produto monta o formulário: sem autofoco,
    // o teclado não sobe sobre "Usei"/"Repus" na abertura da tela.
    await montarFormulario();
    expect(screen.getByLabelText('O que é').props.autoFocus).toBeFalsy();
  });

  it('com autofocarNome o campo de nome recebe foco automático', async () => {
    // É assim que o Cadastrar produto monta: digitar o nome é a primeira ação.
    await montarFormulario({ autofocarNome: true });
    expect(screen.getByLabelText('O que é').props.autoFocus).toBe(true);
  });

  it('sem autofoco o campo continua focável e editável pelo toque', async () => {
    const aoMudar = jest.fn();
    await comTema(
      <FormularioProduto
        valores={VALORES_INICIAIS}
        aoMudar={aoMudar}
        erros={{}}
        categoriasExistentes={[]}
        tituloAcao="Salvar"
        aoSalvar={() => {}}
      />,
    );
    const campo = screen.getByLabelText('O que é');
    await fireEvent(campo, 'focus');
    await fireEvent.changeText(campo, 'Arroz');
    expect(aoMudar).toHaveBeenCalledWith(expect.objectContaining({ nome: 'Arroz' }));
  });
});
