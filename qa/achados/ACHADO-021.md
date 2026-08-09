---
id: ACHADO-021
pr: 4
change: design-system-tema
capability: tipografia-carregada
severidade: baixa
fase: F3
estado: aberto
---
## O que quebra

O requisito "Apenas os pesos efetivamente usados" exige que o peso total das fontes embarcadas seja medido e registrado, e que ultrapassar 400 quilobytes dispare a decisão de remover a família de display. O comentário em `src/presentation/theme/fontes.ts:9` registra manualmente "696 KB embarcados" — **acima do limiar de 400KB citado no spec**, mesmo já tendo removido a família Archivo (display) por causa desse mesmo orçamento. Não há teste ou script que meça o peso automaticamente; o número vem só de um comentário escrito à mão, que pode ficar desatualizado a cada troca de fonte.

## Como reproduzir

```
grep -n "KB\|orçamento" src/presentation/theme/fontes.ts src/presentation/theme/tipografia.ts
```
Mostra o comentário "696 KB embarcados" e a nota de que Archivo foi removida por orçamento — mas 696 > 400.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-design-system-tema/specs/tipografia-carregada/spec.md`, requisito "Apenas os pesos efetivamente usados", cenário "Orçamento de bundle medido".

## Observado (saída real, caminho:linha)

`src/presentation/theme/fontes.ts:9` — comentário manual "696 KB embarcados", sem medição automatizada nem teste que falhe se o valor crescer.

## Change sugerida (slug proposto, escopo de uma frase)

`medir-orcamento-fontes`: revisão humana primeiro para entender se 400KB era o limiar que já disparou a remoção de Archivo (e o restante é aceitável) ou se ainda há orçamento a cortar; depois, um script/teste que soma o tamanho dos arquivos de fonte resolvidos e falha (ou avisa) acima do limiar acordado.
