// Paths SVG (viewBox 24x24, estilo linha, stroke-width 1.5) extraídos ao pé
// da letra do design system "Repor Design System" (claude.ai/design,
// projeto aca58fcf-dc7d-4d76-a375-b1aa5a3dc816) — `PantryScreen.jsx` (buscar/
// adicionar), `TabBar.jsx` (as 3 abas) e `ProductDetailScreen.jsx` (voltar).
// Centralizados aqui pelo mesmo motivo de tokens.ts: um só lugar para os
// dados, componentes só consomem.

export const icones = {
  buscar: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
  adicionar: 'M12 5v14M5 12h14',
  tabDespensa: 'M4 8h16M4 8v10a1 1 0 001 1h14a1 1 0 001-1V8M4 8l1.5-4h13L20 8',
  tabLista: 'M6 6h12M6 12h12M6 18h8M4 6h.01M4 12h.01M4 18h.01',
  tabResumo: 'M5 20V10M12 20V4M19 20v-7',
  // Sem equivalente no design system (TabBar.jsx só desenha 3 abas) —
  // ícone próprio no mesmo estilo (stroke 1.5, sem curvas) para a 4ª aba
  // Configurações, adicionada depois por pedido direto do usuário.
  tabConfiguracoes: 'M4 6h16M4 12h16M4 18h16M8 4v4M14 10v4M10 16v4',
  voltar: 'M15 18l-6-6 6-6',
} as const;

export type NomeDoIcone = keyof typeof icones;
