## Why

O campo de busca da despensa (`app/(tabs)/index.tsx`) usa `useState` local (`busca`,
`buscaAberta`) que nunca é resetado ao trocar de aba — o Expo Router `<Tabs>` mantém a tela
montada (só `display:none`), e não há nenhum `useFocusEffect`/`useIsFocused` no repo. Resultado:
o campo continua com foco/teclado aberto mesmo depois do usuário sair da tela da Despensa.

## What Changes

- Adicionar `useFocusEffect` (expo-router) em `app/(tabs)/index.tsx`: ao perder foco (trocar de
  aba), sempre `Keyboard.dismiss()`; se a busca estiver vazia, fechar o campo
  (`setBuscaAberta(false)`); se houver texto digitado, manter o campo aberto e o filtro ativo
  (só sem foco/teclado) — decisão do usuário: uma busca em andamento não é descartada ao trocar
  de aba, só perde o teclado.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `tela-despensa`: requisito "Busca por nome" ganha um cenário sobre o comportamento do campo
  ao trocar de aba.

## Impact

- `app/(tabs)/index.tsx`
- Testes: presentation, simulando foco/blur de rota.
