/**
 * Busca ignora caixa E acentuação. O `COLLATE NOCASE` do SQLite é ASCII-only
 * e não resolve acento (DATABASE §5.1), então a normalização acontece aqui.
 */
export function normalizarParaBusca(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function casaComBusca(nome: string, termo: string): boolean {
  const alvo = normalizarParaBusca(termo);
  return alvo === '' || normalizarParaBusca(nome).includes(alvo);
}
