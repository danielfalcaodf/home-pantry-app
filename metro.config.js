// Drizzle + expo-sqlite: migrations .sql entram no bundle como fonte.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('sql');

module.exports = config;
