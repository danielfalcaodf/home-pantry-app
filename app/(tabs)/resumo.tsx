import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { EstadoVazio } from '@/presentation/components/estado-vazio';
import { Texto } from '@/presentation/components/texto';
import { espaco } from '@/presentation/theme/espaco';
import { useTheme } from '@/presentation/theme/provider';

// Marcador: os valores e o histórico chegam na change `resumo-valores-e-historico`.
export default function Resumo() {
  const tema = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: tema.bg.base }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingHorizontal: espaco.lg,
          paddingTop: espaco.lg,
        }}
      >
        {/* Alcançável sem navegação profunda (task 6.1): um toque a partir de uma tela principal. */}
        <Pressable
          onPress={() => router.push('/configuracoes')}
          accessibilityRole="button"
          accessibilityLabel="Configurações"
        >
          <Texto papel="body.md" cor={tema.action.azulejo}>
            Configurações
          </Texto>
        </Pressable>
      </View>
      <EstadoVazio convite="O valor da sua despensa e o gasto do mês aparecem aqui." />
    </View>
  );
}
