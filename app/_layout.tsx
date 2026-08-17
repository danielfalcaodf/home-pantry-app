import 'react-native-get-random-values';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { usePreferenciaDeTemaPersistida } from '@/application/tema/use-preferencia-de-tema';
import { usePrepararBanco } from '@/composicao/banco';
import { TelaErro } from '@/presentation/components/tela-erro';
import { fontesDoApp } from '@/presentation/theme/fontes';
import { ThemeProvider, useModoDeTema, useTheme } from '@/presentation/theme/provider';

// A splash só sai quando banco, tema e fontes estiverem prontos — é o que
// impede o quadro branco antes do tema escuro aparecer (FRONTEND §12.4).
void SplashScreen.preventAutoHideAsync();

/**
 * Único `<StatusBar>` do app, montado aqui em vez de por tela — nunca
 * `style="auto"` (segue a aparência do sistema, não a preferência do app;
 * ver design correcao-bordas-do-sistema decisão 3).
 */
function EstiloDaBarraDeStatus() {
  const modo = useModoDeTema();
  return <StatusBar style={modo === 'despensa' ? 'light' : 'dark'} />;
}

function Rotas() {
  const tema = useTheme();
  return (
    <>
      <EstiloDaBarraDeStatus />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: tema.bg.base },
          headerStyle: { backgroundColor: tema.bg.surface },
          headerTintColor: tema.text.primary,
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const banco = usePrepararBanco();
  const [fontesCarregadas, erroDeFonte] = useFonts(fontesDoApp);
  const bancoPronto = banco.pronto && !banco.erro;
  // A leitura da preferência só começa depois das migrations: antes disso a
  // tabela de configuração não existe.
  const tema = usePreferenciaDeTemaPersistida(bancoPronto);

  const tudoPronto =
    bancoPronto && tema.carregada && (fontesCarregadas || erroDeFonte !== null);

  useEffect(() => {
    if (tudoPronto || banco.erro) {
      void SplashScreen.hideAsync();
    }
  }, [tudoPronto, banco.erro]);

  // A tela de erro também usa o tema resolvido — nunca um fundo padrão.
  if (banco.erro) {
    return (
      <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
        <ThemeProvider preferencia={tema.preferencia} escolher={tema.escolher}>
          <EstiloDaBarraDeStatus />
          <TelaErro
            titulo="Não foi possível preparar seus dados"
            descricao="Feche e abra o app de novo. Seus dados têm uma cópia de segurança automática."
            detalhe={banco.erro.message}
          />
        </ThemeProvider>
      </KeyboardProvider>
    );
  }

  if (!tudoPronto) {
    return null; // splash continua visível
  }

  return (
    <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
      <ThemeProvider preferencia={tema.preferencia} escolher={tema.escolher}>
        <Rotas />
      </ThemeProvider>
    </KeyboardProvider>
  );
}
