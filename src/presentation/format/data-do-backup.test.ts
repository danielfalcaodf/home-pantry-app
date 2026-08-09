import { formatarDataDoUltimoBackup } from './data-do-backup';

describe('formatarDataDoUltimoBackup', () => {
  it('convida a fazer o primeiro backup quando nunca houve', () => {
    expect(formatarDataDoUltimoBackup('')).toBe('Você ainda não fez backup.');
  });

  it('formata a data e a hora do último backup', () => {
    // 2024-03-15T10:30:00Z
    const texto = formatarDataDoUltimoBackup('1710498600000');
    expect(texto).toMatch(/^Último backup em \d{2}\/\d{2}\/2024 às \d{2}:\d{2}$/);
  });
});
