---
id: ACHADO-050
pr: 13
change: 2026-08-06-ajuste-visual-telas-design-system
capability: tela-despensa
severidade: media
fase: F3
estado: virou-change
change-correcao: correcao-chips-de-estado
---
## O que quebra

Dois cenários do requisito "Filtro por estado com contagem" não têm teste: (1) a contagem dos chips `Acabou`/`Faltando` atualizando **sem recarregar a tela** quando um item muda de estado (só a função pura `contarPorEstado` é testada com arrays estáticos, não a reatividade do hook `use-produtos`/tela); (2) o chip sem itens permanecer **acionável** (não vira `disabled`) quando a contagem é zero — só a contagem zero em si tem teste.

## Como reproduzir

```
grep -n "disabled\|onPress" src/presentation/format/agrupar-despensa.test.ts src/presentation/components/chip-estado.test.tsx
```
Não há teste que force `contagem=0` em `ChipEstado` e verifique `onPress` continua ativo; não há teste de `app/(tabs)/index.tsx` ou `use-produtos` que force uma mudança de estado e confirme atualização das contagens sem reload.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-06-ajuste-visual-telas-design-system/specs/tela-despensa/spec.md`, cenários "Contagem atualiza após mudança de quantidade" e "Chip sem itens".

## Observado (saída real, caminho:linha)

`app/(tabs)/index.tsx:87` (`useMemo` recalcula ao vivo) e `src/presentation/components/chip-estado.tsx:21-24` (`disabled={!onPress}`, sempre recebe `onPress`) implementam corretamente, mas sem teste dedicado a nenhum dos dois comportamentos.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-reatividade-e-acionabilidade-chips`: estender `chip-estado.test.tsx` com `contagem=0` verificando `onPress` ativo; e um teste de integração leve (hook fake) confirmando que a contagem muda ao alterar o estado de um item sem re-montar o componente.
