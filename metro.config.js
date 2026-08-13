// Drizzle + expo-sqlite: migrations .sql entram no bundle como fonte.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('sql');

// expo-router faz require.context sobre TODO `app/**/*.{ts,tsx}` para montar
// as rotas (node_modules/expo-router/_ctx.*.js) — sem exclusão de arquivo de
// teste. Telas testadas no mesmo diretório (jest testMatch inclui
// `app/**/*.test.{ts,tsx}`) puxam `@testing-library/react-native` (que usa
// `require('console')` do Node) para dentro do bundle nativo e quebram o
// build. Bloquear esses arquivos no resolver do Metro, não no do Jest.
const blockListDefault = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : [config.resolver.blockList].filter(Boolean);
config.resolver.blockList = [...blockListDefault, /\.test\.[jt]sx?$/, /\.spec\.[jt]sx?$/];

module.exports = config;
