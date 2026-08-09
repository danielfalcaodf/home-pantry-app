---
id: ACHADO-019
pr: 4
change: design-system-tema
capability: componentes-base
severidade: baixa
fase: F3
estado: aberto
---
## O que quebra

O requisito "Movimento respeita a preferência de acessibilidade" exige que, com redução de movimento ligada, transições ocorram em corte seco com esmaecimento curto (não física de mola) e que o retorno tátil permaneça. `src/presentation/theme/movimento.ts` implementa isso via `ReduceMotion.System` do Reanimated (a própria biblioteca decide o comportamento), mas nenhum teste renderiza um componente animado com a preferência de redução de movimento simulada e confirma o resultado (nem a duração do esmaecimento, nem a preservação do retorno tátil).

## Como reproduzir

```
find src/presentation -iname "*movimento*test*"
```
Retorna só `format/historico-do-movimento.test.ts`, que é sobre histórico de movimento de estoque (domínio), não sobre a animação `theme/movimento.ts`.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-design-system-tema/specs/componentes-base/spec.md`, requisito "Movimento respeita a preferência de acessibilidade", cenários "Redução de movimento ativa" e "Retorno tátil preservado".

## Observado (saída real, caminho:linha)

`src/presentation/theme/movimento.ts:10,29` usa `ReduceMotion.System` em `MOLA` e em `esmaecer()`; nenhum teste mocka a preferência do sistema (`AccessibilityInfo.isReduceMotionEnabled` ou o mock do Reanimated) para verificar o comportamento resultante.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-reduce-motion`: teste que mocka o módulo `react-native-reanimated` (ou usa o preset de teste que já expõe `ReduceMotion`) para simular preferência ligada, renderiza um componente que usa `molar()`/`esmaecer()`, e confirma que a transição usa `withTiming` com a duração de `DURACAO_FADE` em vez de `withSpring`. Retorno tátil (`expo-haptics`) permanece não avaliável fora de emulador — mesma ressalva já registrada para a F6.
