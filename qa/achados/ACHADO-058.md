---
id: ACHADO-058
pr: 13
change: null
capability: resumo-mensal
severidade: media
fase: F6
estado: aberto
---
## O que quebra

Na tab Resumo, o botão de atalho **"Configurações"** no cabeçalho tem alvo de toque de apenas `[782,50][1038,108]` → 256×**58px** = **22dp** de altura, medido na hierarquia real (densidade 420dpi, mínimo exigido 126px/48dp). Mesmo padrão de violação encontrado no cabeçalho da tab Lista ([[ACHADO-057]]) — sugere que o componente de cabeçalho compartilhado entre as tabs não respeita o alvo mínimo de toque documentado. Reproduzido nos dois temas.

## Como reproduzir

1. Abrir o app, ir para a tab Resumo.
2. Inspecionar a hierarquia de acessibilidade do cabeçalho.
3. Conferir bounds do botão "Configurações": altura de 58px = 22dp, abaixo do limiar de 126px/48dp.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

CLAUDE.md §Design de UI: "Alvos de toque mínimo 48×48dp, inclusive o stepper." O botão "Configurações" do cabeçalho do Resumo tem menos da metade da altura mínima.

## Observado (saída real, caminho:linha)

Botão "Configurações" no cabeçalho da tab Resumo com 58px (22dp) de altura de toque real. Evidência: rodada F6-R2 (2026-08-09), hierarquia via `mcp__maestro__inspect_screen`, screenshots `resumo-escuro.png`/`resumo-claro.png`.

## Change sugerida (slug proposto, escopo de uma frase)

`aumentar-alvo-toque-cabecalho-resumo`: aumentar o alvo de toque do botão "Configurações" no cabeçalho da tab Resumo para 48×48dp — mesma correção de [[ACHADO-057]], possivelmente no mesmo componente de cabeçalho compartilhado entre as tabs.
