import { View } from 'react-native';

import { Texto } from '@/presentation/components/texto';

export default function Produto() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Texto papel="display.sm">Produto</Texto>
    </View>
  );
}
