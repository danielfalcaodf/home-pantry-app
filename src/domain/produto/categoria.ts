// Categoria é texto livre por decisão (DATABASE §3.2), mas nunca o texto cru:
// trim, colapso de espaços e capitalização acontecem antes de qualquer escrita.
export function normalizarCategoria(texto: string): string | null {
  const limpo = texto.trim().replace(/\s+/g, ' ');
  if (limpo === '') {
    return null;
  }
  return limpo.charAt(0).toUpperCase() + limpo.slice(1);
}
