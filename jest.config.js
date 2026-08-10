/**
 * Dois projetos (ARQUITETURA + design da change bootstrap, D3):
 * - `domain`: Node puro, sem transform de React Native — ciclo de segundos,
 *   cobre src/domain/ e src/shared/.
 * - `app`: preset jest-expo, para tudo que depende de módulos do Expo.
 *
 * Cobertura: restrita ao código puro (domain + shared), mínimo 90%.
 * Enquanto src/domain/ está vazio (populado na change fundacao-dominio),
 * o limite é sustentado por src/shared/.
 */
const transformTsPuro = {
  '^.+\\.tsx?$': [
    'babel-jest',
    {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
      ],
    },
  ],
};

module.exports = {
  passWithNoTests: true,
  globalSetup: '<rootDir>/jest.tz.js',
  projects: [
    {
      displayName: 'domain',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/domain/**/*.test.ts',
        '<rootDir>/src/shared/**/*.test.ts',
      ],
      transform: transformTsPuro,
    },
    {
      displayName: 'infra',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/infrastructure/**/*.test.ts'],
      transform: transformTsPuro,
    },
    {
      displayName: 'app',
      preset: 'jest-expo',
      setupFiles: ['<rootDir>/jest.setup.app.js'],
      // Reanimated 4 depende de react-native-worklets, cujas variantes
      // `.native` não resolvem sob Jest; o resolver do próprio pacote as filtra.
      resolver: '<rootDir>/node_modules/react-native-worklets/jest/resolver.js',
      testMatch: [
        '<rootDir>/src/application/**/*.test.{ts,tsx}',
        '<rootDir>/src/presentation/**/*.test.{ts,tsx}',
        '<rootDir>/app/**/*.test.{ts,tsx}',
      ],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
      ],
    },
  ],
  collectCoverageFrom: [
    'src/domain/**/*.ts',
    'src/shared/**/*.ts',
    '!**/*.test.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
