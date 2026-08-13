import { useRouter } from 'expo-router';
import { Alert, Pressable } from 'react-native';

import { ALVO_TOQUE_MINIMO } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { Texto } from './texto';

export type ConfirmacaoDeSaida = { titulo: string; mensagem: string };

export type BotaoVoltarProps = {
  /** Quando presente, pergunta antes de sair (ex.: progresso marcado no modo
   *  compra) — ausente, volta direto como hoje (Detalhe do produto, Cadastrar
   *  produto, sem progresso a perder). A tela decide *quando* confirmar. */
  confirmar?: ConfirmacaoDeSaida;
};

export function BotaoVoltar({ confirmar }: BotaoVoltarProps = {}) {
  const router = useRouter();
  const tema = useTheme();

  function aoTocar() {
    if (!confirmar) {
      router.back();
      return;
    }
    Alert.alert(confirmar.titulo, confirmar.mensagem, [
      { text: 'Manter', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      hitSlop={8}
      style={{
        minWidth: ALVO_TOQUE_MINIMO,
        minHeight: ALVO_TOQUE_MINIMO,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Texto papel="body.lg" cor={tema.text.primary} style={{ fontWeight: '600' }}>
        ←
      </Texto>
    </Pressable>
  );
}
