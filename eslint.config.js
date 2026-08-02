// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const boundaries = require('eslint-plugin-boundaries');

const regraSemHexDeCor = {
  'no-restricted-syntax': [
    'error',
    {
      selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
      message:
        'Cor literal fora de src/presentation/theme/ — use os tokens do tema (FRONTEND §12.1).',
    },
  ],
};

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'coverage/*', '.expo/*'],
  },
  // Regra de dependência entre camadas (ARQUITETURA §2): setas sempre para dentro.
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['src/**/*', 'app/**/*'],
      'boundaries/elements': [
        { type: 'domain', pattern: 'src/domain' },
        { type: 'ports', pattern: 'src/ports' },
        { type: 'application', pattern: 'src/application' },
        { type: 'infrastructure', pattern: 'src/infrastructure' },
        { type: 'presentation', pattern: 'src/presentation' },
        { type: 'shared', pattern: 'src/shared' },
        // Raiz de composição: a ÚNICA que amarra interface a implementação.
        { type: 'composicao', pattern: 'src/composicao' },
        { type: 'app', pattern: 'app' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            { from: [{ element: { type: 'domain' } }], allow: [{ element: { type: 'domain' } }, { element: { type: 'shared' } }] },
            {
              from: [{ element: { type: 'ports' } }],
              allow: [{ element: { type: 'ports' } }, { element: { type: 'domain' } }, { element: { type: 'shared' } }],
            },
            {
              from: [{ element: { type: 'application' } }],
              allow: [
                { element: { type: 'application' } },
                { element: { type: 'domain' } },
                { element: { type: 'ports' } },
                { element: { type: 'shared' } },
              ],
            },
            {
              from: [{ element: { type: 'infrastructure' } }],
              allow: [
                { element: { type: 'infrastructure' } },
                { element: { type: 'ports' } },
                { element: { type: 'domain' } },
                { element: { type: 'shared' } },
              ],
            },
            {
              from: [{ element: { type: 'presentation' } }],
              allow: [
                { element: { type: 'presentation' } },
                { element: { type: 'application' } },
                { element: { type: 'domain' } },
                { element: { type: 'shared' } },
              ],
            },
            { from: [{ element: { type: 'shared' } }], allow: [{ element: { type: 'shared' } }] },
            // Só a composição enxerga infrastructure — é o ponto onde a Fase 2
            // troca o adapter sem que nenhum caso de uso mude (design D5).
            {
              from: [{ element: { type: 'composicao' } }],
              allow: [
                { element: { type: 'composicao' } },
                { element: { type: 'infrastructure' } },
                { element: { type: 'ports' } },
                { element: { type: 'domain' } },
                { element: { type: 'shared' } },
              ],
            },
            {
              from: [{ element: { type: 'app' } }],
              allow: [
                { element: { type: 'app' } },
                { element: { type: 'presentation' } },
                { element: { type: 'application' } },
                { element: { type: 'composicao' } },
                { element: { type: 'domain' } },
                { element: { type: 'shared' } },
              ],
            },
          ],
        },
      ],
    },
  },
  // Domínio é TypeScript puro: nenhum import de React, Expo, Drizzle ou SQLite.
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react/*',
                'react-dom',
                'react-native',
                'react-native/*',
                'react-native-*',
                'expo',
                'expo-*',
                '@expo/*',
                '@expo-google-fonts/*',
                'drizzle-orm',
                'drizzle-orm/*',
                'drizzle-kit',
                '@react-native*',
              ],
              message: 'src/domain/ é TypeScript puro — sem React, Expo, Drizzle ou SQLite.',
            },
          ],
        },
      ],
    },
  },
  // Nenhum hex fora dos tokens de tema.
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    ignores: ['src/presentation/theme/**'],
    rules: regraSemHexDeCor,
  },
  prettierConfig,
]);
