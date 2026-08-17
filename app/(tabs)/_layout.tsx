import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconeSvg } from '@/presentation/components/icone-svg';
import { icones } from '@/presentation/theme/icones';
import { useTheme } from '@/presentation/theme/provider';

const ALTURA_TAB_BAR = 56;

export default function TabsLayout() {
  const tema = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: tema.bg.base },
        tabBarStyle: {
          backgroundColor: tema.bg.surface,
          borderTopColor: tema.line.hairline,
          height: ALTURA_TAB_BAR + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarActiveTintColor: tema.action.azulejo,
        tabBarInactiveTintColor: tema.text.secondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Despensa',
          tabBarIcon: ({ color }) => <IconeSvg path={icones.tabDespensa} cor={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="lista"
        options={{
          title: 'Lista',
          tabBarIcon: ({ color }) => <IconeSvg path={icones.tabLista} cor={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="resumo"
        options={{
          title: 'Resumo',
          tabBarIcon: ({ color }) => <IconeSvg path={icones.tabResumo} cor={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: 'Configurações',
          tabBarIcon: ({ color }) => (
            <IconeSvg path={icones.tabConfiguracoes} cor={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
