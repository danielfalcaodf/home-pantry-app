const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/** "2026-08" → "Agosto de 2026" — só apresentação, sem regra de negócio. */
export function rotuloDoMes(mes: string): string {
  const [ano, mesNum] = mes.split('-').map(Number);
  return `${MESES[mesNum - 1]} de ${ano}`;
}
