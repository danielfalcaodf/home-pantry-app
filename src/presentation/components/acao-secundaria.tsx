import { Pressable, StyleProp, ViewStyle } from 'react-native';

import { ALVO_TOQUE_MINIMO, espaco } from '../theme/espaco';
import { PapelTipografico } from '../theme/tipografia';
import { Texto } from './texto';

export type AcaoSecundariaProps = {
  titulo: string;
  onPress: () => void;
  papel?: PapelTipografico;
  /** Default segue o padrão-fonte (`produto/[id].tsx`, texto secundário).
   *  Ações com cara de link (ex.: "Ver histórico") passam `tema.action.azulejo`. */
  cor?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Ação que parece link e se comporta como botão — extraído do padrão já
 * correto de `app/produto/[id].tsx` ("Ver histórico completo"): `Pressable`
 * com papel e alvo de toque acessíveis, nunca um `<Texto onPress>` (que o
 * TalkBack não anuncia como controle e mede bem abaixo de 48dp).
 */
export function AcaoSecundaria({ titulo, onPress, papel = 'label', cor, style }: AcaoSecundariaProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      hitSlop={8}
      style={[
        {
          minHeight: ALVO_TOQUE_MINIMO,
          justifyContent: 'center',
          paddingHorizontal: espaco.lg,
          paddingVertical: espaco.sm,
        },
        style,
      ]}
    >
      <Texto papel={papel} tom="secondary" cor={cor}>
        {titulo}
      </Texto>
    </Pressable>
  );
}
