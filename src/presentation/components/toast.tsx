import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { espaco, raio } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { Texto } from './texto';

export const DURACAO_TOAST = 5000;

export type ToastProps = {
  mensagem: string;
  acao?: { titulo: string; onPress: () => void };
  duracao?: number;
  onFim: () => void;
  /** Distância da base: o toast fica ACIMA da barra de abas, nunca sobre ela. */
  offsetInferior?: number;
};

/**
 * Um toast por vez: um novo substitui o anterior em vez de empilhar. Pilha de
 * toast some da tela antes de ser lida e esconde a ação de desfazer.
 */
export function Toast({
  mensagem,
  acao,
  duracao = DURACAO_TOAST,
  onFim,
  offsetInferior = espaco.xxxl + espaco.lg,
}: ToastProps) {
  const tema = useTheme();
  const [restante, setRestante] = useState(1);

  useEffect(() => {
    const inicio = Date.now();
    const intervalo = setInterval(() => {
      const fracao = 1 - (Date.now() - inicio) / duracao;
      if (fracao <= 0) {
        clearInterval(intervalo);
        setRestante(0);
        onFim();
        return;
      }
      setRestante(fracao);
    }, 50);
    return () => clearInterval(intervalo);
  }, [mensagem, duracao, onFim]);

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        left: espaco.lg,
        right: espaco.lg,
        bottom: offsetInferior,
        borderRadius: raio.sheet,
        overflow: 'hidden',
        backgroundColor: tema.bg.raised,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: espaco.lg,
          gap: espaco.lg,
        }}
      >
        <Texto papel="body.md" style={{ flexShrink: 1 }}>
          {mensagem}
        </Texto>
        {acao ? (
          <Pressable
            onPress={acao.onPress}
            accessibilityRole="button"
            accessibilityLabel={acao.titulo}
            hitSlop={espaco.md}
          >
            <Texto papel="body.md" cor={tema.action.azulejo}>
              {acao.titulo}
            </Texto>
          </Pressable>
        ) : null}
      </View>
      {/* Barra de tempo: mostra quanto resta para desfazer, sem contagem verbal. */}
      <View
        style={{
          height: 2,
          width: `${restante * 100}%`,
          backgroundColor: tema.action.azulejo,
        }}
      />
    </View>
  );
}
