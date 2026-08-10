---
id: ACHADO-033
pr: 7
change: lista-de-compras
capability: lista-derivada
severidade: baixa
fase: F3
estado: virou-change
change-correcao: cobertura-lista-e-compra
---
## O que quebra

`ItemLista` (`src/presentation/components/item-lista.tsx`) é o componente de linha da lista e é responsável por diferenciar visualmente um avulso de um item de estoque (prefixo `+ ` no nome) e por formatar quantidade/preço na exibição. Não existe nenhum arquivo de teste para esse componente — a distinção visual entre `tipo: 'produto'` e `tipo: 'avulso'` e a exibição de "sem preço" nunca são exercitadas por um teste de renderização.

## Como reproduzir

```
find src -iname "item-lista*test*"
```
Não retorna nenhum arquivo.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-lista-de-compras/specs/lista-derivada/spec.md` (item exibido combina dado do domínio já calculado) e `openspec/changes/archive/2026-08-02-lista-de-compras/specs/custo-estimado/spec.md`, cenário "Marcação de item sem preço".

## Observado (saída real, caminho:linha)

`src/presentation/components/item-lista.tsx:22-30` monta o rótulo `+ ${item.nome}` para avulsos sem nenhum teste que confirme essa distinção nem a exibição de preço/sem-preço.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-item-lista`: RTL renderizando `ItemLista` com item de produto e item avulso, confirmando o prefixo visual do avulso e a indicação de sem-preço quando `semPreco` é verdadeiro.
