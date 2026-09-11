// Updater custom do commit-and-tag-version (interface readVersion/writeVersion)
// para sincronizar app.json > expo.version com o bump feito em package.json —
// o app.json aninha a versão sob "expo", que o updater "json" embutido na lib
// não enxerga. Indentação fixa em 2 espaços + LF: é o que já está em app.json.
module.exports.readVersion = function readVersion(contents) {
  return JSON.parse(contents).expo.version;
};

module.exports.writeVersion = function writeVersion(contents, version) {
  const json = JSON.parse(contents);
  json.expo.version = version;
  return `${JSON.stringify(json, null, 2)}\n`;
};
