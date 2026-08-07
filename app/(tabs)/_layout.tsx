import { Tabs } from 'expo-router';

import { useTheme } from '@/presentation/theme/provider';

export default function TabsLayout() {
  const tema = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: tema.bg.base },
        tabBarStyle: { backgroundColor: tema.bg.surface, borderTopColor: tema.line.hairline },
        tabBarActiveTintColor: tema.action.azulejo,
        tabBarInactiveTintColor: tema.text.secondary,
        tabBarIcon: () => null,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Despensa' }} />
      <Tabs.Screen name="lista" options={{ title: 'Lista' }} />
      <Tabs.Screen name="resumo" options={{ title: 'Resumo' }} />
    </Tabs>
  );
}
