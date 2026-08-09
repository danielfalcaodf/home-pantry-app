// Reanimated roda worklets na thread de interface; sob Jest não há módulo
// nativo, então o mock oficial aplica os valores de imediato, sem animar.

// Háptico é efeito de hardware: no teste basta não quebrar.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));
