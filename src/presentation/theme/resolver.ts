import { NomeDoTema } from './tokens';

export type PreferenciaDeTema = 'automatico' | 'claro' | 'escuro';
// 'unspecified' aparece no Android quando o sistema não declara preferência.
export type AparenciaDoSistema = 'light' | 'dark' | 'unspecified' | null | undefined;

/**
 * Escolha explícita vence a do sistema; `automatico` segue a aparência.
 * Sistema indefinido (ainda não resolvido) cai no claro, que é o padrão do
 * React Native quando `useColorScheme` retorna null.
 */
export function resolverTema(
  preferencia: PreferenciaDeTema,
  aparencia: AparenciaDoSistema,
): NomeDoTema {
  if (preferencia === 'claro') {
    return 'porcelana';
  }
  if (preferencia === 'escuro') {
    return 'despensa';
  }
  return aparencia === 'dark' ? 'despensa' : 'porcelana';
}
