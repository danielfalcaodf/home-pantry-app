import { View } from 'react-native';

import { BaseDePreco } from '../../domain/shared/dinheiro';
import { espaco } from '../theme/espaco';
import { ChipEstado } from './chip-estado';

// Base de digitação do preço de produto em kg (etiqueta de balcão costuma
// vir por 100 g). Só escolhe a base — quem salva converte com `precoPorKg`.
export function SeletorBasePreco({
  base,
  aoMudar,
}: {
  base: BaseDePreco;
  aoMudar: (base: BaseDePreco) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: espaco.sm }}>
      <ChipEstado rotulo="por kg" ativo={base === 'kg'} onPress={() => aoMudar('kg')} />
      <ChipEstado rotulo="por 100 g" ativo={base === '100g'} onPress={() => aoMudar('100g')} />
    </View>
  );
}
