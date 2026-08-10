---
id: ACHADO-025
pr: 5
change: despensa-e-cadastro-produto
capability: medidor-linha-dagua
severidade: baixa
fase: F3
estado: virou-change
change-correcao: cobertura-componentes-apresentacao
---
## O que quebra

O requisito "Linha de item como medidor vertical" exige explicitamente que a lista não use cards, bordas ou sombras ("Sem contêiner visual"). O teste de conformidade em `medidor-e-item.test.tsx:103-112` (leitura de fonte via `fs.readFileSync`) verifica ausência de aritmética de domínio e ausência de gestos de swipe, mas não verifica ausência de `shadowColor`/`elevation`/`borderRadius` (fora do zero esperado) nos estilos de `item-despensa.tsx`. É o mesmo mecanismo de teste já usado no arquivo — só falta o caso adicional.

## Como reproduzir

```
grep -n "shadow\|elevation\|borderRadius\|borderWidth" src/presentation/components/item-despensa.tsx
grep -n "Swipe\|PanGesture\|aritmetica" src/presentation/components/medidor-e-item.test.tsx
```
O teste de conformidade existente não busca por `shadow`/`elevation`/`borderWidth`.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-despensa-e-cadastro-produto/specs/medidor-linha-dagua/spec.md`, requisito "Linha de item como medidor vertical", cenário "Sem contêiner visual": "nenhuma linha possui card, borda arredondada ou sombra; as linhas são separadas por divisores de 1 ponto".

## Observado (saída real, caminho:linha)

`src/presentation/components/medidor-e-item.test.tsx:103-112` — bloco de conformidade existente cobre aritmética e swipe, mas não estilo de contêiner (sombra/borda/raio).

## Change sugerida (slug proposto, escopo de uma frase)

`teste-conformidade-sem-container`: estender o `it.each` de conformidade já existente com uma checagem adicional via `fs.readFileSync` que garanta ausência de `shadowColor`, `shadowOpacity`, `elevation` e `borderRadius` diferente de `raio.linha` (0) em `item-despensa.tsx`.
