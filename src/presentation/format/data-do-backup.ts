// '' é o padrão de PADROES.ultimoBackupEm — "nunca houve backup" é um valor
// de configuração normal, não um caso de erro.
export function formatarDataDoUltimoBackup(ultimoBackupEm: string): string {
  if (ultimoBackupEm === '') {
    return 'Você ainda não fez backup.';
  }
  const data = new Date(Number(ultimoBackupEm));
  const dataFormatada = data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `Último backup em ${dataFormatada} às ${horaFormatada}`;
}
