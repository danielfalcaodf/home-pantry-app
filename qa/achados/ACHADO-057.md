---
id: ACHADO-057
pr: 7
change: null
capability: lista-de-compras
severidade: media
fase: F6
estado: virou-change
change-correcao: alvos-de-toque-e-acessibilidade
---
## O que quebra

Na tab Lista (`app/(tabs)/lista.tsx`), os dois botões de cabeçalho **"Compartilhar lista"** e **"Agrupar por categoria"** têm alvo de toque real bem abaixo do mínimo de 48×48dp exigido pelo CLAUDE.md. Medido na hierarquia de acessibilidade real do emulador (densidade 420dpi, onde 48dp = 126px):

- `"Compartilhar lista"`: bounds `[616,50][852,108]` → 236×**58px** = 236×**22dp** de altura.
- `"Agrupar por categoria"`: bounds `[894,50][1038,108]` → 144×**58px** = 144×**22dp** de altura.

Ambos ficam lado a lado no cabeçalho, com menos da metade da altura mínima exigida — alvo pequeno e fácil de errar no uso real de uma mão (contexto do app: corredor de mercado). Reproduzido nos dois temas (Despensa escuro e Porcelana claro), mesma estrutura de bounds.

## Como reproduzir

1. Abrir o app, ir para a tab Lista.
2. Inspecionar a hierarquia de acessibilidade do cabeçalho (`mcp__maestro__inspect_screen` ou `adb shell uiautomator dump`).
3. Conferir os bounds de `"Compartilhar lista"` e `"Agrupar por categoria"`: altura de 58px em tela com densidade 420dpi = 22dp, abaixo do limiar de 48dp/126px.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

CLAUDE.md §Design de UI: "Alvos de toque mínimo 48×48dp, inclusive o stepper." Os dois botões de cabeçalho da tab Lista não cumprem esse mínimo em nenhum dos dois eixos relevantes (altura de 22dp).

## Observado (saída real, caminho:linha)

`app/(tabs)/lista.tsx` — botões de cabeçalho "Compartilhar lista" e "Agrupar por categoria" renderizados com altura efetiva de toque de 58px (22dp) em vez de pelo menos 126px (48dp). Evidência de runtime: rodada F6-R2 (2026-08-09), hierarquia real via `mcp__maestro__inspect_screen`, screenshots `lista-escuro.png`/`lista-claro.png` em `qa/por-pr/evidencias` (ou scratchpad da sessão).

## Change sugerida (slug proposto, escopo de uma frase)

`aumentar-alvo-toque-cabecalho-lista`: aumentar o `hitSlop`/altura de toque dos botões "Compartilhar lista" e "Agrupar por categoria" no cabeçalho de `app/(tabs)/lista.tsx` para pelo menos 48×48dp, sem necessariamente aumentar o tamanho visual do ícone.
