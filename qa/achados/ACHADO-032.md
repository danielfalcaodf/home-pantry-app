---
id: ACHADO-032
pr: 7
change: lista-de-compras
capability: custo-estimado
severidade: baixa
fase: F3
estado: aberto
---
## O que quebra

Os requisitos "Itens sem preço não corrompem o total" e "Rodapé com totais" exigem, na interface, a indicação visual de item sem preço e a exibição de contagem/total no rodapé em família monoespaçada, com o rótulo inequívoco de "estimado da compra" (requisito "Distinção entre valor da lista e valor do estoque"). Toda essa renderização está em `RodapeTotal` (`src/presentation/components/rodape-total.tsx`), que não tem nenhum arquivo de teste. A lógica de cálculo (`totalDaListaDeCompras`) é testada no domínio, mas a renderização do rótulo e da contagem de itens sem preço nunca é verificada.

## Como reproduzir

```
find src -iname "*rodape-total*test*"
```
Não retorna nenhum arquivo.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-lista-de-compras/specs/custo-estimado/spec.md`, requisitos "Rodapé com totais" e "Distinção entre valor da lista e valor do estoque", cenários "Contagem e total exibidos", "Total inclui avulsos" e "Rótulo inequívoco".

## Observado (saída real, caminho:linha)

`src/presentation/components/rodape-total.tsx:20-40` renderiza contagem, total formatado e contagem de itens sem preço sem nenhum teste correspondente.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-rodape-total`: RTL renderizando `RodapeTotal` com combinações de `contagemItens`/`total`/`contagemSemPreco`, confirmando texto do rótulo "estimado" e presença condicional da linha de itens sem preço.
