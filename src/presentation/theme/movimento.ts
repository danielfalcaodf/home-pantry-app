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
/** Contração do stepper no toque: 0,92 e volta, em ~90ms. */
export const ESCALA_PRESSIONADO = 0.92;
export const DURACAO_CONTRACAO = 90;

// 'worklet': ambas são chamadas de dentro de callbacks de animação que já
// rodam na UI thread (ex.: o retorno de withTiming em StepperConsumo) — sem
// a diretiva, o plugin de worklets não consegue autotransformar uma função
// importada de outro módulo, só literais inline.
export function molar<T extends number>(destino: T) {
  'worklet';
  return withSpring(destino, MOLA);
}

export function esmaecer<T extends number>(destino: T) {
  'worklet';
  return withTiming(destino, {
    duration: DURACAO_FADE,
    reduceMotion: ReduceMotion.System,
  });
}
