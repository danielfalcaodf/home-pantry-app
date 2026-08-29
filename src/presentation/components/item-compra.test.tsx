import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { ItemDaCompra } from '../../application/compra/use-modo-compra';
import { CompraItem } from '../../domain/compra/compra';
import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { ALVO_TOQUE_MINIMO, raio } from '../theme/espaco';
import { ThemeProvider } from '../theme/provider';
import { despensa } from '../theme/tokens';
import { ItemCompra } from './item-compra';

function estiloResolvido(elemento: { props: { style?: unknown } }) {
  const { style } = elemento.props;
  return Array.isArray(style) ? Object.assign({}, ...style) : style;
}

function comTema(no: ReactNode) {
  return render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

function itemBase(sobrescreve: Partial<CompraItem> = {}): CompraItem {
  return {
    id: 'item-1',
    compraId: 'compra-1',
    produtoId: 'p1',
    nomeAvulso: null,
    unidade: 'un',
    quantidadePlanejada: milesimos(2000),
    quantidadeComprada: null,
    valorEstimadoUnit: centavos(890),
    valorPagoUnitario: null,
    comprado: false,
    ordem: 0,
    excluido: false,
    atualizarPreco: null,
    ...sobrescreve,
  };
}

function linhaBase(sobrescreve: Partial<ItemDaCompra> = {}): ItemDaCompra {
  return {
    item: itemBase(),
    produto: { id: 'p1', nome: 'Arroz', categoria: 'Grãos', unidade: 'un', valorUnitario: centavos(890) },
    divergePreco: false,
    ...sobrescreve,
  };
}

describe('ItemCompra', () => {
  afterEach(cleanup);
  it('item não marcado mostra nome, quantidade e preço estimado', async () => {
    await comTema(
      <ItemCompra linha={linhaBase()} onMarcar={jest.fn()} onDesmarcar={jest.fn()} onAjustar={jest.fn()} />,
    );
    expect(screen.getByText('Arroz')).toBeTruthy();
    expect(screen.getByText('R$ 8,90')).toBeTruthy();
  });

  it('toque na linha marca o item', async () => {
    const onMarcar = jest.fn();
    await comTema(
      <ItemCompra linha={linhaBase()} onMarcar={onMarcar} onDesmarcar={jest.fn()} onAjustar={jest.fn()} />,
    );
    fireEvent.press(screen.getByRole('checkbox', { name: /Arroz/ }));
    expect(onMarcar).toHaveBeenCalledTimes(1);
  });

  it('item marcado tem risco no nome e chama desmarcar ao tocar de novo', async () => {
    const onDesmarcar = jest.fn();
    await comTema(
      <ItemCompra
        linha={linhaBase({ item: itemBase({ comprado: true, quantidadeComprada: milesimos(2000) }) })}
        onMarcar={jest.fn()}
        onDesmarcar={onDesmarcar}
        onAjustar={jest.fn()}
       
      />,
    );
    fireEvent.press(screen.getByRole('checkbox', { name: /Arroz/ }));
    expect(onDesmarcar).toHaveBeenCalledTimes(1);
  });

  it('item avulso nunca mostra a pergunta de atualizar preço', async () => {
    await comTema(
      <ItemCompra
        linha={linhaBase({
          item: itemBase({ produtoId: null, nomeAvulso: 'Pilha AA', comprado: true, quantidadeComprada: milesimos(1000), valorPagoUnitario: centavos(300) }),
          produto: null,
          divergePreco: false,
        })}
        onMarcar={jest.fn()}
        onDesmarcar={jest.fn()}
        onAjustar={jest.fn()}
       
      />,
    );
    expect(screen.queryByText(/Atualizar o preço/)).toBeNull();
  });

  it('item marcado com preço divergente não interrompe a marcação com chips inline', async () => {
    await comTema(
      <ItemCompra
        linha={linhaBase({
          item: itemBase({ comprado: true, quantidadeComprada: milesimos(2000), valorPagoUnitario: centavos(950) }),
          divergePreco: true,
        })}
        onMarcar={jest.fn()}
        onDesmarcar={jest.fn()}
        onAjustar={jest.fn()}
       
      />,
    );
    expect(screen.queryByText(/Atualizar o preço de Arroz/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sim' })).toBeNull();
  });

  it('expõe controles acessíveis para diminuir e aumentar quantidade', async () => {
    const onDiminuirQuantidade = jest.fn();
    const onAumentarQuantidade = jest.fn();
    await comTema(
      <ItemCompra
        linha={linhaBase()}
        onMarcar={jest.fn()}
        onDesmarcar={jest.fn()}
        onAjustar={jest.fn()}
       
        onDiminuirQuantidade={onDiminuirQuantidade}
        onAumentarQuantidade={onAumentarQuantidade}
      />,
    );

    expect(screen.getByRole('button', { name: 'Diminuir quantidade de Arroz' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Aumentar quantidade de Arroz' })).toBeTruthy();
    expect(onDiminuirQuantidade).not.toHaveBeenCalled();
    expect(onAumentarQuantidade).not.toHaveBeenCalled();
  });

  // Achado de QA: ao chegar no piso, o botão "-" continuava com a mesma
  // aparência de sempre habilitado — toques adicionais eram no-ops
  // silenciosos, sem indicar visualmente que não há mais o que diminuir.
  it('no piso de quantidade, o controle de diminuir fica desabilitado (sem indicar erro silencioso)', async () => {
    await comTema(
      <ItemCompra
        linha={linhaBase()}
        onMarcar={jest.fn()}
        onDesmarcar={jest.fn()}
        onAjustar={jest.fn()}
        onDiminuirQuantidade={jest.fn()}
        onAumentarQuantidade={jest.fn()}
        podeDiminuirQuantidade={false}
      />,
    );

    const botaoDiminuir = screen.getByRole('button', { name: 'Diminuir quantidade de Arroz' });
    expect(botaoDiminuir.props.accessibilityState.disabled).toBe(true);
  });

  // ACHADO-037 (task 7.1): item marcado perde toda a tinta (design D7) —
  // risco no nome, cor secundária, sem preenchimento no fundo do preço.
  it('item marcado tem risco e cor secundária no nome', async () => {
    await comTema(
      <ItemCompra
        linha={linhaBase({ item: itemBase({ comprado: true, quantidadeComprada: milesimos(2000) }) })}
        onMarcar={jest.fn()}
        onDesmarcar={jest.fn()}
        onAjustar={jest.fn()}
       
      />,
    );
    const nome = screen.getByText('Arroz');
    expect(estiloResolvido(nome).textDecorationLine).toBe('line-through');
    expect(estiloResolvido(nome).color).toBe(despensa.text.secondary);
  });

  it('item não marcado não tem risco no nome', async () => {
    await comTema(
      <ItemCompra linha={linhaBase()} onMarcar={jest.fn()} onDesmarcar={jest.fn()} onAjustar={jest.fn()} />,
    );
    const nome = screen.getByText('Arroz');
    expect(estiloResolvido(nome)?.textDecorationLine).toBeUndefined();
    expect(estiloResolvido(nome).color).toBe(despensa.text.primary);
  });

  // ACHADO-037 (task 7.2): controle de marcação é quadrado (raio.linha),
  // não circular, com área tocável de no mínimo 48×48.
  it('controle de marcação é quadrado e a área tocável mede no mínimo 48×48', async () => {
    await comTema(
      <ItemCompra linha={linhaBase()} onMarcar={jest.fn()} onDesmarcar={jest.fn()} onAjustar={jest.fn()} />,
    );
    const areaTocavel = screen.getByTestId('area-marcacao');
    const estiloArea = estiloResolvido(areaTocavel);
    expect(estiloArea.width).toBeGreaterThanOrEqual(ALVO_TOQUE_MINIMO);
    expect(estiloArea.height).toBeGreaterThanOrEqual(ALVO_TOQUE_MINIMO);

    const quadrado = screen.getByTestId('marcacao-quadrado');
    expect(estiloResolvido(quadrado).borderRadius).toBe(raio.linha);
  });

  // ACHADO affordance (correcao-lista-de-compras, task 3.1): o ajuste por
  // toque longo não tinha nenhuma pista visual — só o gesto invisível.
  it('mostra um ícone indicador de que a linha aceita ajuste', async () => {
    await comTema(
      <ItemCompra linha={linhaBase()} onMarcar={jest.fn()} onDesmarcar={jest.fn()} onAjustar={jest.fn()} />,
    );
    expect(screen.getByTestId('icone-ajustar')).toBeTruthy();
  });

  it('toque longo na linha continua chamando onAjustar (sem regressão)', async () => {
    const onAjustar = jest.fn();
    await comTema(
      <ItemCompra linha={linhaBase()} onMarcar={jest.fn()} onDesmarcar={jest.fn()} onAjustar={onAjustar} />,
    );
    fireEvent(screen.getByRole('checkbox', { name: /Arroz/ }), 'longPress');
    expect(onAjustar).toHaveBeenCalledTimes(1);
  });
});
