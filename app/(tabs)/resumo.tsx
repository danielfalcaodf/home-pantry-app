import { View } from 'react-native';

import { EstadoVazio } from '@/presentation/components/estado-vazio';
import { useTheme } from '@/presentation/theme/provider';

// Marcador: os valores e o histórico chegam na change `resumo-valores-e-historico`.
export default function Resumo() {
  const tema = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: tema.bg.base }}>
      <EstadoVazio convite="O valor da sua despensa e o gasto do mês aparecem aqui." />
    </View>
  );
}
