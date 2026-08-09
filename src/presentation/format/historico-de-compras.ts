export function formatarDataDaCompra(dataEm: number): string {
  return new Date(dataEm).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
