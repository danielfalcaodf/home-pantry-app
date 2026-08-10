---
id: ACHADO-052
pr: 13
change: 2026-08-06-ajuste-visual-telas-design-system
capability: n/a
severidade: baixa
fase: F3
estado: virou-change
change-correcao: cobertura-telas-e-navegacao
---
## O que quebra

Três ajustes visuais desta PR descritos só em `proposal.md`/`design.md` (sem delta de spec formal) não têm teste de integração: a posição do `RodapeCompra` movida para logo acima do botão "Fechar compra" em `app/compra/[id].tsx`; "Gasto este mês" promovido a métrica `data.xl` em `app/(tabs)/resumo.tsx`; e o corte para "últimos 4 meses" (`MESES_NO_GRAFICO = 4`, `slice(0,4).reverse()`) alimentando o `GraficoBarras`. O componente `GraficoBarras` em si está bem testado isoladamente, mas a integração específica (que exatamente 4 meses, na ordem certa, chegam a ele a partir de `gastoMensal.meses`) não é.

## Como reproduzir

```
grep -n "RodapeCompra\|MESES_NO_GRAFICO" app/compra/\[id\].tsx app/\(tabs\)/resumo.tsx
find app -iname "*resumo*test*" -o -iname "*compra*id*test*"
```
Nenhum teste de tela para `resumo.tsx` ou `compra/[id].tsx` que cubra esses pontos específicos.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

Não há requisito formal de spec — item descrito em `openspec/changes/archive/2026-08-06-ajuste-visual-telas-design-system/proposal.md`, seção "What Changes": posição do `RodapeCompra`, métrica grande do gasto mensal e mini gráfico de barras dos últimos 4 meses.

## Observado (saída real, caminho:linha)

`app/compra/[id].tsx:114-127` (`RodapeCompra` junto ao botão de fechar); `app/(tabs)/resumo.tsx:115-120` (`papel="data.xl"`); `app/(tabs)/resumo.tsx:9,16,143-153` (`MESES_NO_GRAFICO`, `slice`) — implementados, sem teste de integração.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-integracao-resumo-modo-compra`: testes leves de tela para `resumo.tsx` (confirmando que exatamente 4 meses, na ordem certa, chegam ao gráfico) e `compra/[id].tsx` (confirmando a ordem visual rodapé→botão).
