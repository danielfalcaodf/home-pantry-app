import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { ReactNode, useState } from 'react';

import { milesimos } from '../../domain/shared/quantidade';
import { ThemeProvider } from '../theme/provider';
import { StepperConsumo } from './stepper-consumo';
import { TecladoQuantidade } from './teclado-quantidade';
import { RegistroParaDesfazer, ToastDesfazer } from './toast-desfazer';
import { useRegistroDeConsumo } from './use-registro-de-consumo';

async function comTema(no: ReactNode) {
  await render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

// Drena as promessas pendentes antes de desmontar: sem isso, a resolução de
// um teste cai no seguinte e derruba a árvore dele.
afterEach(async () => {
  await act(async () => {
    await Promise.resolve();
  });
  cleanup();
});

const arroz = { nome: 'Arroz', unidade: 'pacote' as const };

describe('useRegistroDeConsumo — a confirmação descreve o movimento certo', () => {
  it('três registros em sequência: a confirmação visível aponta o último id', async () => {
    const { result } = await renderHook(() => useRegistroDeConsumo());
    await waitFor(() => expect(result.current).not.toBeNull());

    for (const movimentoId of ['mov-1', 'mov-2', 'mov-3']) {
      await act(async () => {
        result.current.anunciar(
          { gravou: true, movimentoId, zerou: false },
          arroz,
          milesimos(1000),
          'consumo',
        );
      });
    }
    // Substituição, não empilhamento: sobra um registro, o mais recente.
    expect(result.current.registro).toEqual({
      movimentoId: 'mov-3',
      mensagem: 'Anotado: 1 pacote de Arroz',
    });
  });

  it('usa o vocabulário do usuário, sem termo de sistema', async () => {
    const { result } = await renderHook(() => useRegistroDeConsumo());
    await waitFor(() => expect(result.current).not.toBeNull());
    await act(async () => {
      result.current.anunciar(
        { gravou: true, movimentoId: 'm', zerou: false },
        arroz,
        milesimos(2000),
        'reposicao',
      );
    });
    const mensagem = result.current.registro?.mensagem ?? '';
    expect(mensagem).toBe('Anotado: repus 2 pacotes de Arroz');
    expect(mensagem.toLowerCase()).not.toMatch(/baixa|movimento|estoque/);
  });

  it('item que acaba recebe aviso próprio, ainda com o desfazer disponível', async () => {
    const { result } = await renderHook(() => useRegistroDeConsumo());
    await waitFor(() => expect(result.current).not.toBeNull());
    await act(async () => {
      result.current.anunciar(
        { gravou: true, movimentoId: 'm', zerou: true },
        arroz,
        milesimos(1000),
        'consumo',
      );
    });
    expect(result.current.aviso).toBe('Arroz acabou');
    expect(result.current.registro?.movimentoId).toBe('m');
  });

  it('item já zerado avisa sem oferecer desfazer', async () => {
    const { result } = await renderHook(() => useRegistroDeConsumo());
    await waitFor(() => expect(result.current).not.toBeNull());
    await act(async () => {
      result.current.anunciar(
        { gravou: false, motivo: 'estoque_zerado' },
        arroz,
        milesimos(1000),
        'consumo',
      );
    });
    expect(result.current.aviso).toBe('Esse item já está zerado');
    expect(result.current.registro).toBeNull();
  });

  it('falha de gravação avisa e guarda a tentativa para repetir', async () => {
    const { result } = await renderHook(() => useRegistroDeConsumo());
    await waitFor(() => expect(result.current).not.toBeNull());
    const tentar = jest.fn();
    await act(async () => {
      result.current.anunciar({ erro: true }, arroz, milesimos(1000), 'consumo', tentar);
    });
    expect(result.current.aviso).toBe('Não deu para anotar agora');
    expect(result.current.registro).toBeNull();
    result.current.tentarNovamente.current?.();
    expect(tentar).toHaveBeenCalled();
  });
});

describe('ToastDesfazer', () => {
  it('desfaz o movimento descrito na confirmação, não o último gravado', async () => {
    const aoDesfazer = jest.fn();
    const registro: RegistroParaDesfazer = {
      movimentoId: 'mov-1',
      mensagem: 'Anotado: 1 pacote de Arroz',
    };
    await comTema(
      <ToastDesfazer registro={registro} onDesfazer={aoDesfazer} onFim={jest.fn()} />,
    );
    fireEvent.press(screen.getByLabelText('Desfazer'));
    expect(aoDesfazer).toHaveBeenCalledWith('mov-1');
  });

  it('sem registro não renderiza nada', async () => {
    await comTema(<ToastDesfazer registro={null} onDesfazer={jest.fn()} onFim={jest.fn()} />);
    expect(screen.queryByLabelText('Desfazer')).toBeNull();
  });
});

describe('StepperConsumo', () => {
  it('toque simples registra sem confirmação e sem navegação', async () => {
    const aoRegistrar = jest.fn();
    await comTema(
      <StepperConsumo rotuloAcessivel="Registrar consumo" onRegistrar={aoRegistrar} />,
    );
    fireEvent.press(screen.getByLabelText('Registrar consumo'));
    expect(aoRegistrar).toHaveBeenCalledTimes(1);
  });

  it('zerado não registra e é anunciado como desabilitado', async () => {
    const aoRegistrar = jest.fn();
    await comTema(
      <StepperConsumo rotuloAcessivel="Registrar consumo" desabilitado onRegistrar={aoRegistrar} />,
    );
    const botao = screen.getByLabelText('Registrar consumo');
    fireEvent.press(botao);
    expect(aoRegistrar).not.toHaveBeenCalled();
    expect(botao.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
  });

  it('toque longo abre o painel de quantidade', async () => {
    const aoAbrir = jest.fn();
    await comTema(
      <StepperConsumo
        rotuloAcessivel="Registrar consumo"
        onRegistrar={jest.fn()}
        onAbrirTeclado={aoAbrir}
      />,
    );
    fireEvent(screen.getByLabelText('Registrar consumo'), 'longPress');
    expect(aoAbrir).toHaveBeenCalled();
  });

  // O háptico sai no instante do toque, antes de qualquer resposta do banco
  // (ACHADO-026) — é o que faz o gesto parecer instantâneo (KPI K4).
  it('o toque dispara o retorno tátil antes do callback de registro terminar', async () => {
    const ordem: string[] = [];
    const aoRegistrar = jest.fn(() => {
      ordem.push('onRegistrar resolvido');
    });
    (Haptics.impactAsync as jest.Mock).mockImplementationOnce(async () => {
      ordem.push('Haptics.impactAsync chamado');
    });

    await comTema(
      <StepperConsumo rotuloAcessivel="Registrar consumo" onRegistrar={aoRegistrar} />,
    );
    fireEvent.press(screen.getByLabelText('Registrar consumo'));

    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    expect(aoRegistrar).toHaveBeenCalledTimes(1);
    expect(ordem).toEqual(['Haptics.impactAsync chamado', 'onRegistrar resolvido']);
  });
});

// Ordem importa aqui: sob Jest, um Modal fechado em um teste deixa o
// seguinte sem conteúdo na árvore. O caso de estado inicial vem primeiro,
// que é também a ordem natural de leitura.
describe('TecladoQuantidade', () => {
  function Painel({ onUsei, onRepus }: { onUsei: jest.Mock; onRepus: jest.Mock }) {
    const [visivel, setVisivel] = useState(true);
    return (
      <TecladoQuantidade
        visivel={visivel}
        nomeDoItem="Arroz"
        unidade="kg"
        onFechar={() => setVisivel(false)}
        onUsei={onUsei}
        onRepus={onRepus}
      />
    );
  }

  it('valor vazio ou zero não habilita as ações', async () => {
    const botaoUsei = () => screen.getByLabelText('Usei');
    await comTema(<Painel onUsei={jest.fn()} onRepus={jest.fn()} />);
    // O conteúdo do Modal só entra na árvore no ciclo seguinte ao render.
    await waitFor(() => expect(botaoUsei()).toBeTruthy());
    expect(botaoUsei().props.accessibilityState.disabled).toBe(true);
    fireEvent.changeText(screen.getByLabelText('Quantidade'), '0');
    await waitFor(() => expect(botaoUsei().props.accessibilityState.disabled).toBe(true));
  });

  it('registra consumo com o valor digitado e fecha', async () => {
    const onUsei = jest.fn();
    await comTema(<Painel onUsei={onUsei} onRepus={jest.fn()} />);
    fireEvent.changeText(screen.getByLabelText('Quantidade'), '1,5');
    await waitFor(() => expect(screen.getByLabelText('Usei').props.accessibilityState.disabled).toBe(false));
    fireEvent.press(screen.getByLabelText('Usei'));
    expect(onUsei).toHaveBeenCalledWith(1.5);
  });

  // Espelha o teste anterior para o caminho "Repus" (ACHADO-027): mesma
  // simetria de cobertura entre registrar consumo e registrar reposição.
  it('registra reposição com o valor digitado e fecha', async () => {
    const onRepus = jest.fn();
    await comTema(<Painel onUsei={jest.fn()} onRepus={onRepus} />);
    fireEvent.changeText(screen.getByLabelText('Quantidade'), '1,5');
    await waitFor(() => expect(screen.getByLabelText('Repus').props.accessibilityState.disabled).toBe(false));
    fireEvent.press(screen.getByLabelText('Repus'));
    expect(onRepus).toHaveBeenCalledWith(1.5);
  });

  it('fechar sem confirmar não altera nada', async () => {
    const onUsei = jest.fn();
    const onRepus = jest.fn();
    await comTema(<Painel onUsei={onUsei} onRepus={onRepus} />);
    fireEvent.changeText(screen.getByLabelText('Quantidade'), '2');
    fireEvent.press(screen.getByLabelText('Fechar'));
    expect(onUsei).not.toHaveBeenCalled();
    expect(onRepus).not.toHaveBeenCalled();
  });

});
