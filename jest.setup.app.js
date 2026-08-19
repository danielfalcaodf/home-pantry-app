// Reanimated roda worklets na thread de interface; sob Jest não há módulo
// nativo, então o mock oficial aplica os valores de imediato, sem animar.

// Háptico é efeito de hardware: no teste basta não quebrar.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

// Mock oficial da lib — sem ele, GestureHandlerRootView (necessário na raiz
// pra alinhar toque/pintura em Surfaces secundárias como o OverKeyboardView)
// quebra sob Jest por depender de módulo nativo.
require('react-native-gesture-handler/jestSetup');

// react-native-keyboard-controller é módulo nativo (NativeEventEmitter) —
// sem o mock oficial da própria lib, qualquer import quebra sob Jest. O mock
// oficial de `OverKeyboardView`, porém, é uma string opaca que ignora a prop
// `visible` — a implementação real desmonta os filhos com `visible &&
// children` (ver node_modules/.../views/OverKeyboardView/index.tsx). Sem
// esse gate, os 5 sheets (`PainelInferior`) ficam sempre montados sob Jest,
// mesmo fechados — sobrescrevemos só essa peça para bater com o real.
jest.mock('react-native-keyboard-controller', () => {
  const React = jest.requireActual('react');
  const mockOficial = require('react-native-keyboard-controller/jest');
  return {
    ...mockOficial,
    OverKeyboardView: ({ visible, children }) => (visible ? React.createElement(React.Fragment, null, children) : null),
  };
});

// useSafeAreaInsets() exige <SafeAreaProvider> no topo da árvore — o mock
// oficial devolve insets zerados sem precisar envolver cada teste com o
// provider manualmente.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
