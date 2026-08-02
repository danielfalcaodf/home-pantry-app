import { View } from 'react-native';

import { EstadoVazio } from '@/presentation/components/estado-vazio';
import { useTheme } from '@/presentation/theme/provider';

// Marcador: a lista derivada chega na change `lista-de-compras`.
export default function Lista() {
  const tema = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: tema.bg.base }}>
      <EstadoVazio convite="Sua lista de compras aparece aqui quando algo começar a faltar." />
    </View>
  );
}
