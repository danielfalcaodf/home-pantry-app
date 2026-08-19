import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { PreferenciaDeTema, resolverTema } from './resolver';
import { NomeDoTema, Theme, temas } from './tokens';

type ContextoDeTema = {
  tema: Theme;
  /** 'despensa' (escuro) | 'porcelana' (claro) — mesmo nome resolvido que
   *  indexa `temas`, exposto para quem precisa do nome e não só dos
   *  tokens (ex.: `<StatusBar>`). */
  modo: NomeDoTema;
  preferencia: PreferenciaDeTema;
  escolher: (nova: PreferenciaDeTema) => Promise<void>;
};

const Contexto = createContext<ContextoDeTema | null>(null);

const escolherPadrao = async () => {};

export function ThemeProvider({
  preferencia,
  escolher = escolherPadrao,
  children,
}: {
  preferencia: PreferenciaDeTema;
  /**
   * Única instância de `usePreferenciaDeTemaPersistida` vive no layout raiz
   * (precisa resolver o tema antes da splash sair) — a tela de
   * configurações troca a preferência por aqui, nunca com uma segunda
   * instância do hook, senão as duas ficariam fora de sincronia. Opcional
   * só para não obrigar todo teste de componente a passar um no-op.
   */
  escolher?: (nova: PreferenciaDeTema) => Promise<void>;
  children: ReactNode;
}) {
  // useColorScheme já re-renderiza quando a aparência do sistema muda —
  // o modo automático acompanha sem reinício do app.
  const aparencia = useColorScheme();
  const valor = useMemo<ContextoDeTema>(() => {
    const modo = resolverTema(preferencia, aparencia);
    return { tema: temas[modo], modo, preferencia, escolher };
  }, [preferencia, aparencia, escolher]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useTheme(): Theme {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error('useTheme precisa estar dentro de ThemeProvider');
  }
  return contexto.tema;
}

export function useModoDeTema(): NomeDoTema {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error('useModoDeTema precisa estar dentro de ThemeProvider');
  }
  return contexto.modo;
}

export function usePreferenciaDeTema(): PreferenciaDeTema {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error('usePreferenciaDeTema precisa estar dentro de ThemeProvider');
  }
  return contexto.preferencia;
}

/** Troca a preferência de tema a partir de qualquer tela — ver nota em `ThemeProvider`. */
export function useEscolherTema(): (nova: PreferenciaDeTema) => Promise<void> {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error('useEscolherTema precisa estar dentro de ThemeProvider');
  }
  return contexto.escolher;
}
