import { render, screen } from '@testing-library/react-native';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ReactNode } from 'react';

import { ThemeProvider } from '../theme/provider';
import { despensa } from '../theme/tokens';
import { ItemDespensa } from './item-despensa';
import { MedidorNivel } from './medidor-nivel';

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

/** As camadas do medidor são ocultas ao leitor de tela de propósito — o
 *  estado é anunciado pelo rótulo da linha —, então a consulta precisa
 *  incluir elementos escondidos. */
function camada(testID: string) {
  return screen.getByTestId(testID, { includeHiddenElements: true });
}

function estilos(elemento: { props: Record<string, unknown> }): Record<string, unknown> {
  const bruto = elemento.props.style;
  const lista = Array.isArray(bruto) ? bruto.flat(Infinity) : [bruto];
  return Object.assign({}, ...lista.filter(Boolean));
}

describe('MedidorNivel', () => {
  it('parcial: tinta na fração recebida, com a opacidade do tema', async () => {
    await comTema(<MedidorNivel fracao={0.5} estado="emFalta" temSobra={false} />);
    const estilo = estilos(camada('medidor-tinta'));
    expect(estilo.height).toBe('50%');
    expect(estilo.opacity).toBe(despensa.fillOpacity);
    expect(estilo.backgroundColor).toBe(despensa.state.emFalta);
  });

  it('zerado: nenhuma tinta, só a régua na base em crítico', async () => {
    await comTema(<MedidorNivel fracao={0} estado="critico" temSobra={false} />);
    expect(estilos(camada('medidor-tinta')).height).toBe(0);
    const regua = estilos(camada('medidor-regua'));
    expect(regua.bottom).toBe(0);
    expect(regua.backgroundColor).toBe(despensa.state.critico);
  });

  it('cheio: tinta em altura total, régua rente ao topo, sem extravasar', async () => {
    await comTema(<MedidorNivel fracao={1} estado="ok" temSobra={false} />);
    expect(estilos(camada('medidor-tinta')).height).toBe('100%');
    expect(estilos(camada('medidor-regua')).bottom).toBe('100%');
  });

  it('com sobra: traço fino acima da régua, sem número e sem etiqueta', async () => {
    await comTema(<MedidorNivel fracao={1} estado="ok" temSobra />);
    expect(screen.queryByText(/\d/)).toBeNull();
    expect(estilos(camada('medidor-sobra')).height).toBe(1);
  });
});

describe('ItemDespensa', () => {
  const base = {
    nome: 'Café em pó',
    categoria: 'Mercearia',
    leitura: '2 de 3 pacotes',
    rotuloEstado: 'Falta 1',
    estado: 'emFalta' as const,
    fracao: 0.667,
    temSobra: false,
    rotuloAcaoConsumo: 'Registrar consumo de 1 pacote de Café em pó',
    onAbrir: jest.fn(),
  };

  it('anuncia a linha com nome, leitura e estado', async () => {
    await comTema(<ItemDespensa {...base} />);
    expect(screen.getByLabelText('Café em pó, 2 de 3 pacotes, Falta 1')).toBeTruthy();
  });

  it('anuncia o botão com a ação completa, nunca só "menos"', async () => {
    await comTema(<ItemDespensa {...base} onConsumir={jest.fn()} />);
    const botao = screen.getByLabelText('Registrar consumo de 1 pacote de Café em pó');
    expect(botao.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: false }),
    );
  });

  it('item zerado mantém o botão no layout, apenas esmaecido e desabilitado', async () => {
    await comTema(
      <ItemDespensa
        {...base}
        estado="critico"
        fracao={0}
        rotuloEstado="Acabou"
        onConsumir={jest.fn()}
      />,
    );
    const botao = screen.getByLabelText(base.rotuloAcaoConsumo);
    const estilo = estilos(botao);
    expect(estilo.opacity).toBeLessThan(1);
    expect(estilo.width).toBe(48);
    expect(estilo.height).toBe(48);
    expect(botao.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
  });
});

describe('conformidade do medidor e da linha', () => {
  it.each(['medidor-nivel.tsx', 'item-despensa.tsx'])(
    '%s não faz aritmética sobre quantidade',
    (nome) => {
      const fonte = fs.readFileSync(path.join(__dirname, nome), 'utf8');
      // A única aritmética permitida é converter fração para porcentagem.
      const suspeitas = fonte.match(/quantidade\w*\s*[-+*/]/g);
      expect(suspeitas).toBeNull();
      expect(fonte).not.toMatch(/quantidadeNecessaria/);
    },
  );

  it('a linha não registra nenhum gesto de deslizar', () => {
    const fonte = fs.readFileSync(path.join(__dirname, 'item-despensa.tsx'), 'utf8');
    expect(fonte).not.toMatch(/Swipe|PanGesture|onSwipe|Swipeable/i);
  });
});
