import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme/provider';

export type TelaBaseProps = {
  children: ReactNode;
  /** Topo é o padrão: cobre relógio/notch. Telas que ancoram botão na base
   *  (fora do grupo de abas, que já resolve o inset inferior na tab bar)
   *  também passam 'bottom'. */
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
};

/**
 * Ponto único de consumo do `SafeAreaProvider` que o Expo Router já monta
 * na raiz (`ExpoRoot.js`) — nunca monta um provider novo, só aplica os
 * insets reais do sistema como padding, em vez de cada tela chamar
 * `useSafeAreaInsets()` e arriscar divergir (correcao-bordas-do-sistema).
 */
export function TelaBase({ children, edges = ['top'], style }: TelaBaseProps) {
  const tema = useTheme();
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: tema.bg.base }, style]}>
      {children}
    </SafeAreaView>
  );
}
