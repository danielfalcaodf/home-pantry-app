---
id: ACHADO-042
pr: 10
change: 2026-08-03-ajuste-e-conferencia-estoque
capability: modo-conferencia
severidade: media
fase: F3
estado: aberto
---
## O que quebra

`app/conferencia.tsx`, `app/diagnostico.tsx` e `app/produto/[id]/historico.tsx` não têm nenhum teste próprio. Toda a lógica subjacente (`use-conferencia`, `use-diagnostico`, `use-historico`) está bem testada, mas o comportamento composto na tela não é: progresso "N de M" visível, confirmar exigindo um único toque, correção da conferência sem diálogo adicional, mensagens de diagnóstico sem/com divergência (afirmativa vs. acionável), e a distinção visual entre tipos de movimento no histórico.

## Como reproduzir

```
find app -iname "*conferencia*test*" -o -iname "*diagnostico*test*"
find app/produto -iname "*historico*test*"
```
Nenhum arquivo retornado.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-03-ajuste-e-conferencia-estoque/specs/modo-conferencia/spec.md`, cenários "Progresso visível", "Confirmar exige um toque", "Sem diálogo de confirmação"; `diagnostico-de-integridade/spec.md`, cenários "Resultado sem divergência é afirmativo" e "Resultado com divergência é acionável"; `historico-do-produto/spec.md`, cenário "Tipos distinguíveis".

## Observado (saída real, caminho:linha)

`app/conferencia.tsx:97-108` (progresso e botão de confirmar), `app/diagnostico.tsx:36-79` (mensagens), `app/produto/[id]/historico.tsx:39` (uso de `corDoMovimento`) — todos sem cobertura de teste de tela.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-telas-conferencia-diagnostico-historico`: RTL cobrindo as três telas com hooks mockados, focando nos comportamentos que só existem na composição (toque único, ausência de diálogo, texto das mensagens, cor por tipo de movimento).
