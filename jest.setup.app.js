// Reanimated roda worklets na thread de interface; sob Jest não há módulo
// nativo, então o mock oficial aplica os valores de imediato, sem animar.

// Háptico é efeito de hardware: no teste basta não quebrar.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

// react-native-keyboard-controller é módulo nativo (NativeEventEmitter) —
// sem o mock oficial da própria lib, qualquer import quebra sob Jest.
jest.mock('react-native-keyboard-controller', () => require('react-native-keyboard-controller/jest'));
