import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Texto } from '@/presentation/components/texto';
import { useTheme } from '@/presentation/theme/provider';

export default function ModoCompra() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tema = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: tema.bg.base }}>
      <Texto papel="display.sm">Compra {id}</Texto>
    </View>
  );
}
