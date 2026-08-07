// Paths SVG (viewBox 24x24, estilo linha) extraídos do design system "Repor
// Design System" — centralizados aqui pelo mesmo motivo de tokens.ts: um só
// lugar para os dados, componentes só consomem.

export const icones = {
  buscar: ['M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z', 'M21 21l-4.35-4.35'],
  adicionar: ['M12 5v14', 'M5 12h14'],
  tabDespensa: [
    'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8',
    'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  ],
  tabLista: ['M3 12h.01', 'M3 18h.01', 'M3 6h.01', 'M8 12h13', 'M8 18h13', 'M8 6h13'],
  tabResumo: ['M3 3v16a2 2 0 0 0 2 2h16', 'M18 17V9', 'M13 17V5', 'M8 17v-3'],
  voltar: ['M19 12H5', 'M12 19l-7-7 7-7'],
} as const;

export type NomeDoIcone = keyof typeof icones;
