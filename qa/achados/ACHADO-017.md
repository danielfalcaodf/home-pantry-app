---
id: ACHADO-017
pr: 4
change: design-system-tema
capability: componentes-base
severidade: media
fase: F3
estado: virou-change
change-correcao: correcao-chips-de-estado
---
## O que quebra

O requisito "Chip de estado com contagem" exige que um chip ativo receba "fundo na cor do estado com opacidade reduzida e texto na cor cheia". A implementação em `src/presentation/components/chip-estado.tsx:31` usa `backgroundColor: ativo ? tema.bg.raised : 'transparent'` — uma cor neutra de superfície elevada, não a cor do estado (`cor` prop) com o token `fillOpacity` do tema (0,12 escuro / 0,10 claro, já usado em outros lugares do design system). Além da possível divergência de implementação, nenhum teste exercita a prop `ativo` — os dois testes existentes de `ChipEstado` (`componentes-base.test.tsx:88,93`) não passam `ativo={true}`.

## Como reproduzir

```
sed -n '16,35p' src/presentation/components/chip-estado.tsx
grep -n "ativo" src/presentation/components/componentes-base.test.tsx
```
O grep no teste não retorna nenhuma linha usando `ativo`.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-design-system-tema/specs/componentes-base/spec.md`, requisito "Chip de estado com contagem", cenário "Chip ativo é distinguível": "WHEN um chip está ativo THEN ele recebe fundo na cor do estado com opacidade reduzida e texto na cor cheia".

## Observado (saída real, caminho:linha)

`src/presentation/components/chip-estado.tsx:31`:
```ts
backgroundColor: ativo ? tema.bg.raised : 'transparent',
```
Não usa `cor` (prop) nem `tema.fillOpacity`.

## Change sugerida (slug proposto, escopo de uma frase)

`revisar-chip-estado-ativo`: decisão humana primeiro (confirmar se `bg.raised` foi uma escolha deliberada divergente do texto do spec, ou se é a implementação que precisa mudar para usar `cor` + `fillOpacity`); depois, se confirmado como divergência, corrigir o componente e adicionar teste que renderiza `ativo={true}` com uma `cor` e verifica o fundo resultante.
