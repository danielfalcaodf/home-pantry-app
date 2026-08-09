module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Drizzle: importa o conteúdo dos .sql das migrations como string.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
