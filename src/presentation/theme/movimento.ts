import { ReduceMotion, withSpring, withTiming } from 'react-native-reanimated';

// Uma configuração de mola para o app inteiro (FRONTEND §9): damping 18 é o
// que dá o assentar de líquido sem parecer gelatina.
export const MOLA = {
  damping: 18,
  stiffness: 180,
  mass: 1,
  // ReduceMotion.System faz o Reanimated respeitar a preferência de
  // acessibilidade sozinho — nenhum componente checa a flag manualmente.
  reduceMotion: ReduceMotion.System,
} as const;

export const DURACAO_FADE = 100;

export function molar<T extends number>(destino: T) {
  return withSpring(destino, MOLA);
}

export function esmaecer<T extends number>(destino: T) {
  return withTiming(destino, {
    duration: DURACAO_FADE,
    reduceMotion: ReduceMotion.System,
  });
}
