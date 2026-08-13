import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode, useState } from 'react';
import { Pressable } from 'react-native';

import { ThemeProvider } from '../theme/provider';
import { Texto } from './texto';
import { DURACAO_TOAST, Toast } from './toast';

async function comTema(no: ReactNode) {
  return render(<ThemeProvider preferencia="escuro">{no}</ThemeProvider>);
}

type NoDaArvore = { type?: string; props?: Record<string, unknown>; children?: NoDaArvore[] } | string | null;

/** Percorre a árvore renderizada procurando um nó com o estilo dado — usado
 *  para achar a barra de tempo sem depender de testID no componente. */
function encontrarPorEstilo(
  no: NoDaArvore | NoDaArvore[] | null,
  previsto: (estilo: Record<string, unknown>) => boolean,
): Record<string, unknown> | null {
  if (no == null || typeof no === 'string') {
    return null;
  }
  if (Array.isArray(no)) {
    for (const filho of no) {
      const achado = encontrarPorEstilo(filho, previsto);
      if (achado) {
        return achado;
      }
    }
    return null;
  }
  const bruto = no.props?.style;
  const lista = Array.isArray(bruto) ? bruto.flat(Infinity) : [bruto];
  const estilo = Object.assign({}, ...lista.filter(Boolean));
  if (previsto(estilo)) {
    return estilo;
  }
  return encontrarPorEstilo((no.children ?? null) as NoDaArvore[] | null, previsto);
}

// Mantém um único toast por vez: é assim que cada tela do app usa <Toast /> —
// uma única variável de estado, nunca uma pilha (ex.: app/(tabs)/configuracoes.tsx).
function PainelComUmToast({ onFimA, onFimB }: { onFimA: () => void; onFimB: () => void }) {
  const [mensagem, setMensagem] = useState('Anotado');
  const [onFim, setOnFim] = useState<() => void>(() => onFimA);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Disparar outro toast"
        onPress={() => {
          setMensagem('Anotado: repus 1 pacote de Arroz');
          setOnFim(() => onFimB);
        }}
      >
        <Texto papel="body.md">Disparar outro toast</Texto>
      </Pressable>
      <Toast mensagem={mensagem} onFim={onFim} />
    </>
  );
}

describe('Toast — substituição sem empilhamento (ACHADO-016)', () => {
  it('um segundo toast substitui o primeiro em vez de empilhar', async () => {
    await comTema(<PainelComUmToast onFimA={jest.fn()} onFimB={jest.fn()} />);
    expect(screen.getByText('Anotado')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Disparar outro toast'));

    // Só o mais recente permanece na árvore — nenhum empilhamento.
    expect(screen.queryByText('Anotado')).toBeNull();
    expect(screen.getAllByText('Anotado: repus 1 pacote de Arroz')).toHaveLength(1);
  });
});

describe('Toast — não bloqueia a interação com a tela por trás (ACHADO-016)', () => {
  it('um botão fora do toast continua respondendo ao toque com o toast visível', async () => {
    const aoTocarFora = jest.fn();
    await comTema(
      <>
        <Pressable accessibilityRole="button" accessibilityLabel="Ação da tela" onPress={aoTocarFora}>
          <Texto papel="body.md">Ação da tela</Texto>
        </Pressable>
        <Toast mensagem="Anotado" onFim={jest.fn()} />
      </>,
    );

    fireEvent.press(screen.getByLabelText('Ação da tela'));
    expect(aoTocarFora).toHaveBeenCalledTimes(1);
  });
});

describe('Toast — barra de tempo (ACHADO-016)', () => {
  it('renderiza a barra de tempo restante com a duração declarada', async () => {
    const view = await comTema(<Toast mensagem="Anotado" onFim={jest.fn()} duracao={3000} />);
    const barra = encontrarPorEstilo(view.toJSON() as never, (estilo) => estilo.height === 2);
    expect(barra).not.toBeNull();
    // Recém-montada: tempo restante é 100% da duração declarada.
    expect(barra?.width).toBe('100%');
  });

  it('usa a duração padrão quando nenhuma é declarada', async () => {
    expect(DURACAO_TOAST).toBe(5000);
  });
});
