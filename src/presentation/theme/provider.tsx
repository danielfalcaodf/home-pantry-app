import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { PreferenciaDeTema, resolverTema } from './resolver';
import { Theme, temas } from './tokens';

type ContextoDeTema = {
  tema: Theme;
  preferencia: PreferenciaDeTema;
};

const Contexto = createContext<ContextoDeTema | null>(null);

export function ThemeProvider({
  preferencia,
  children,
}: {
  preferencia: PreferenciaDeTema;
  children: ReactNode;
}) {
  // useColorScheme já re-renderiza quando a aparência do sistema muda —
  // o modo automático acompanha sem reinício do app.
  const aparencia = useColorScheme();
  const valor = useMemo<ContextoDeTema>(
    () => ({ tema: temas[resolverTema(preferencia, aparencia)], preferencia }),
    [preferencia, aparencia],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useTheme(): Theme {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error('useTheme precisa estar dentro de ThemeProvider');
  }
  return contexto.tema;
}

export function usePreferenciaDeTema(): PreferenciaDeTema {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error('usePreferenciaDeTema precisa estar dentro de ThemeProvider');
  }
  return contexto.preferencia;
}
