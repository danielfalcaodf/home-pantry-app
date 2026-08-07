import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { ALVO_TOQUE_MINIMO } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { Texto } from './texto';

export function BotaoVoltar() {
  const router = useRouter();
  const tema = useTheme();

  return (
    <Pressable
      onPress={() => router.back()}
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
