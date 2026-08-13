import { render } from '@testing-library/react-native';

import { ThemeProvider } from '@/presentation/theme/provider';
import { despensa } from '@/presentation/theme/tokens';
import { icones } from '@/presentation/theme/icones';
import TabsLayout from './_layout';

const mockTabs = jest.fn();
const mockScreen = jest.fn();

// Render raso (design decision #2): captura as props passadas a `Tabs` e a
// cada `Tabs.Screen`, sem montar a árvore de navegação real do
// `@react-navigation/native` (evita depender do comportamento interno dele
// num teste unitário).
jest.mock('expo-router', () => {
  const React = jest.requireActual('react');
  function Tabs(props: { screenOptions?: unknown; children?: unknown }) {
    mockTabs(props);
    return React.createElement(React.Fragment, null, props.children);
  }
  function TabsScreen(props: unknown) {
    mockScreen(props);
    return null;
  }
  Tabs.Screen = TabsScreen;
  return { Tabs };
});

async function comTema() {
  await render(
    <ThemeProvider preferencia="escuro">
      <TabsLayout />
    </ThemeProvider>,
  );
}

describe('TabsLayout — screenOptions (ACHADO-048, task 4.2)', () => {
  beforeEach(() => {
    mockTabs.mockClear();
    mockScreen.mockClear();
  });

  it('headerShown é false em todas as abas', async () => {
    await comTema();
    const { screenOptions } = mockTabs.mock.calls[0][0] as { screenOptions: { headerShown: boolean } };
    expect(screenOptions.headerShown).toBe(false);
  });
});

describe('Tab bar — 4 ícones e cor por estado de ativação (ACHADO-051)', () => {
  beforeEach(() => {
    mockTabs.mockClear();
    mockScreen.mockClear();
  });

  // Task 6.1: os 4 ícones (Despensa, Lista, Resumo, Configurações) presentes.
  it('registra as 4 abas: Despensa, Lista, Resumo e Configurações', async () => {
    await comTema();
    const nomes = mockScreen.mock.calls.map(([props]) => (props as { name: string }).name);
    const titulos = mockScreen.mock.calls.map(([props]) => (props as { options: { title: string } }).options.title);
    expect(nomes).toEqual(['index', 'lista', 'resumo', 'configuracoes']);
    expect(titulos).toEqual(['Despensa', 'Lista', 'Resumo', 'Configurações']);
  });

  // Task 6.2: cor `action.azulejo` na aba ativa, `text.secondary` nas inativas
  // — screenOptions fixa as duas cores para o React Navigation resolver, e
  // cada `tabBarIcon` honra a cor que o React Navigation lhe passa.
  it('screenOptions define action.azulejo (ativa) e text.secondary (inativas)', async () => {
    await comTema();
    const { screenOptions } = mockTabs.mock.calls[0][0] as {
      screenOptions: { tabBarActiveTintColor: string; tabBarInactiveTintColor: string };
    };
    expect(screenOptions.tabBarActiveTintColor).toBe(despensa.action.azulejo);
    expect(screenOptions.tabBarInactiveTintColor).toBe(despensa.text.secondary);
  });

  // Task 6.3: trocar de aba muda corretamente qual ícone recebe a cor ativa
  // — cada tabBarIcon é uma função pura de `color`, não hardcoded na
  // primeira aba: chamando com cores diferentes por aba, cada uma responde
  // com o path certo e a cor recebida, nunca presa a um valor fixo.
  it('cada tabBarIcon renderiza o ícone certo com a cor recebida, não presa à primeira aba', async () => {
    await comTema();
    type IconeProps = { cor: string; path: string };
    const props = mockScreen.mock.calls.map(([p]) => p as { name: string; options: { tabBarIcon: (a: { focused: boolean; color: string; size: number }) => React.ReactElement<IconeProps> } });
    expect(props).toHaveLength(4);

    const paths = [icones.tabDespensa, icones.tabLista, icones.tabResumo, icones.tabConfiguracoes];
    props.forEach((registro, indice) => {
      const corSimulada = indice % 2 === 0 ? despensa.action.azulejo : despensa.text.secondary;
      const elemento = registro.options.tabBarIcon({ focused: indice === 0, color: corSimulada, size: 24 });
      expect(elemento.props.cor).toBe(corSimulada);
      expect(elemento.props.path).toBe(paths[indice]);
    });

    // Ícones distintos entre si — nenhuma aba reaproveita o path de outra.
    expect(new Set(paths).size).toBe(4);
  });
});
