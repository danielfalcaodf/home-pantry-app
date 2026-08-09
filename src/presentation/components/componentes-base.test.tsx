import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ReactNode } from 'react';

import { ThemeProvider } from '../theme/provider';
import { despensa, porcelana } from '../theme/tokens';
import { Botao } from './botao';
import { CampoTexto } from './campo-texto';
import { ChipEstado } from './chip-estado';
import { EstadoVazio } from './estado-vazio';
import { TelaErro } from './tela-erro';
import { Texto } from './texto';

async function comTema(no: ReactNode, preferencia: 'claro' | 'escuro' = 'escuro') {
  await render(<ThemeProvider preferencia={preferencia}>{no}</ThemeProvider>);
}

function estiloDe(elemento: { props: Record<string, unknown> }): Record<string, unknown> {
  const bruto = elemento.props.style;
  const lista = Array.isArray(bruto) ? bruto.flat(Infinity) : [bruto];
  return Object.assign({}, ...lista.filter(Boolean));
}

describe('Texto', () => {
  it('usa o papel da escala e a cor do tema', async () => {
    await comTema(<Texto papel="body.lg">Arroz</Texto>);
    const estilo = estiloDe(screen.getByText('Arroz'));
    expect(estilo.fontSize).toBe(17);
    expect(estilo.color).toBe(despensa.text.primary);
  });

  it('papel de dado sai com figuras tabulares', async () => {
    await comTema(<Texto papel="data.md">12,90</Texto>);
    expect(estiloDe(screen.getByText('12,90')).fontVariant).toEqual(['tabular-nums']);
  });

  it('acompanha o tema claro', async () => {
    await comTema(<Texto>Arroz</Texto>, 'claro');
    expect(estiloDe(screen.getByText('Arroz')).color).toBe(porcelana.text.primary);
  });
});

describe('Botao', () => {
  it('tem alvo de toque mínimo de 48 e anuncia o papel', async () => {
    await comTema(<Botao titulo="Usei" onPress={() => {}} />);
    const botao = screen.getByRole('button', { name: 'Usei' });
    const estilo = estiloDe(botao);
    expect(estilo.minHeight).toBe(48);
    expect(estilo.minWidth).toBe(48);
  });

  it('desabilitado é anunciado ao leitor de tela e não dispara', async () => {
    const aoTocar = jest.fn();
    await comTema(<Botao titulo="Usei" disabled onPress={aoTocar} />);
    const botao = screen.getByRole('button', { name: 'Usei' });
    expect(botao.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
    fireEvent.press(botao);
    expect(aoTocar).not.toHaveBeenCalled();
  });
});

describe('CampoTexto', () => {
  it('mantém o rótulo visível acima do campo', async () => {
    await comTema(<CampoTexto rotulo="Nome" value="" onChangeText={() => {}} />);
    expect(screen.getByText('Nome')).toBeTruthy();
    expect(screen.getByLabelText('Nome')).toBeTruthy();
  });

  it('em foco o divisor fica na cor de ação, com 2 pontos', async () => {
    await comTema(<CampoTexto rotulo="Nome" value="" onChangeText={() => {}} />);
    await fireEvent(screen.getByLabelText('Nome'), 'focus');
    // Re-consulta: o estilo só reflete o foco depois do re-render.
    await waitFor(() => {
      const estilo = estiloDe(screen.getByLabelText('Nome'));
      expect(estilo.borderBottomWidth).toBe(2);
      expect(estilo.borderBottomColor).toBe(despensa.action.azulejo);
    });
  });

  it('erro aparece como texto, não só como cor', async () => {
    await comTema(<CampoTexto rotulo="Nome" erro="Dê um nome ao produto" value="" />);
    expect(screen.getByText('Dê um nome ao produto')).toBeTruthy();
  });
});

describe('ChipEstado', () => {
  it('mostra rótulo e contagem e anuncia os dois juntos', async () => {
    await comTema(<ChipEstado rotulo="Faltando" contagem={3} onPress={() => {}} />);
    expect(screen.getByRole('button', { name: 'Faltando, 3' })).toBeTruthy();
  });

  it('recebe a cor pronta, sem conhecer o domínio', async () => {
    await comTema(<ChipEstado rotulo="Acabou" cor={despensa.state.critico} />);
    expect(estiloDe(screen.getByText('Acabou')).color).toBe(despensa.state.critico);
  });
});

describe('EstadoVazio e TelaErro', () => {
  it('estado vazio convida e oferece a ação', async () => {
    const aoTocar = jest.fn();
    await comTema(
      <EstadoVazio
        convite="Nada cadastrado ainda."
        acao={{ titulo: 'Começar pela lista básica', onPress: aoTocar }}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Começar pela lista básica' }));
    expect(aoTocar).toHaveBeenCalled();
  });

  it('tela de erro declara o que houve sem pedir desculpas', async () => {
    await comTema(<TelaErro titulo="Não foi possível preparar seus dados" descricao="Tente de novo." />);
    const titulo = screen.getByText('Não foi possível preparar seus dados');
    expect(titulo).toBeTruthy();
    expect(screen.queryByText(/desculpe|sentimos muito/i)).toBeNull();
  });
});

describe('conformidade dos componentes-base', () => {
  const diretorio = __dirname;
  const arquivos = fs
    .readdirSync(diretorio)
    .filter((nome) => nome.endsWith('.tsx') && !nome.endsWith('.test.tsx'));

  // Tipos e formatadores do domínio são permitidos (ARQUITETURA §2); regra de
  // negócio e camadas de fora, não.
  it.each(arquivos)('%s não importa application, infrastructure nem composicao', (nome) => {
    const fonte = fs.readFileSync(path.join(diretorio, nome), 'utf8');
    expect(fonte).not.toMatch(/from ['"].*\/(application|infrastructure|composicao)\//);
  });

  it.each(arquivos)('%s não importa regra de domínio, só tipos e formatadores', (nome) => {
    const fonte = fs.readFileSync(path.join(diretorio, nome), 'utf8');
    expect(fonte).not.toMatch(/from ['"].*\.rules['"]/);
    expect(fonte).not.toMatch(/from ['"].*\/(validacao|produto\/produto)['"]/);
  });

  it.each(arquivos)('%s não contém literal hexadecimal de cor', (nome) => {
    const fonte = fs.readFileSync(path.join(diretorio, nome), 'utf8');
    expect(fonte).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
