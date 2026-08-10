---
id: ACHADO-030
pr: 7
change: lista-de-compras
capability: lista-derivada
severidade: media
fase: F3
estado: virou-change
change-correcao: cobertura-lista-e-compra
---
## O que quebra

O requisito "Ordenação e agrupamento por categoria" exige que a lista alterne entre visão agrupada (cabeçalhos de categoria em ordem alfabética, itens alfabéticos dentro do grupo) e visão contínua (lista única por nome). Toda essa lógica está em `src/presentation/format/agrupar-lista.ts` (`agruparListaPorCategoria`, `listaContinua`), incluindo a regra não trivial de que avulsos (sem categoria) caem no grupo "Sem categoria" e esse grupo sempre aparece por último. Não existe nenhum arquivo de teste para esse módulo — os cenários "Visão agrupada" e "Visão contínua" não têm cobertura direta (só são exercitados indiretamente via `gerarTextoDaLista`, que testa o texto exportado, não a estrutura de linhas usada pela tela).

## Como reproduzir

```
find src -iname "*agrupar-lista*test*"
```
Não retorna nenhum arquivo.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-lista-de-compras/specs/lista-derivada/spec.md`, requisito "Ordenação e agrupamento por categoria", cenários "Visão agrupada" e "Visão contínua".

## Observado (saída real, caminho:linha)

`src/presentation/format/agrupar-lista.ts:16-43` implementa `agruparListaPorCategoria` e `listaContinua` sem nenhum teste correspondente (`src/presentation/format/agrupar-lista.test.ts` não existe).

## Change sugerida (slug proposto, escopo de uma frase)

`teste-agrupar-lista`: testes unitários puros para `agruparListaPorCategoria` (grupos em ordem alfabética, "Sem categoria" por último, itens ordenados dentro do grupo) e `listaContinua` (ordenação única por nome, avulsos misturados aos produtos).
