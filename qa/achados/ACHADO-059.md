---
id: ACHADO-059
pr: 13
change: null
capability: configuracoes
severidade: media
fase: F6
estado: aberto
---
## O que quebra

Na tab Configurações (`app/(tabs)/configuracoes.tsx`), os três botões de seleção de tema ("Tema Automático", "Tema Claro", "Tema Escuro") têm apenas **105px de altura** de alvo de toque real, medidos na hierarquia (densidade 420dpi, mínimo exigido 126px/48dp = 40dp real):

- `"Tema Automático"`: `[42,332][318,437]` → 276×105px = 40dp
- `"Tema Claro"`: `[339,332][502,437]` → 163×105px = 40dp
- `"Tema Escuro"`: `[523,332][714,437]` → 191×105px = 40dp

Abaixo do mínimo em todos os três, nos dois temas (estrutura idêntica).

## Como reproduzir

1. Abrir o app, ir para a tab Configurações.
2. Inspecionar a hierarquia de acessibilidade da seção "Tema".
3. Conferir bounds dos três botões de seleção: altura de 105px = 40dp, abaixo do limiar de 126px/48dp.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

CLAUDE.md §Design de UI: "Alvos de toque mínimo 48×48dp, inclusive o stepper." Os três seletores de tema ficam 8dp abaixo do mínimo.

## Observado (saída real, caminho:linha)

`app/(tabs)/configuracoes.tsx` — seletor de tema com altura de toque de 105px (40dp) por opção. Evidência: rodada F6-R2 (2026-08-09), hierarquia via `mcp__maestro__inspect_screen`, screenshots `config-escuro.png`/`config-claro.png`.

## Change sugerida (slug proposto, escopo de uma frase)

`aumentar-alvo-toque-seletor-tema`: aumentar a altura de toque dos três botões de seleção de tema em `app/(tabs)/configuracoes.tsx` de 40dp para pelo menos 48dp.
