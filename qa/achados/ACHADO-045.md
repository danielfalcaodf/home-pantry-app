---
id: ACHADO-045
pr: 11
change: 2026-08-03-resumo-valores-e-historico
capability: resumo-de-valores
severidade: media
fase: F3
estado: aberto
---
## O que quebra

Nenhuma das 3 telas da feature (`app/(tabs)/resumo.tsx`, `app/compra/historico.tsx`, `app/compra/historico/[id].tsx`) tem teste próprio. Isso deixa sem verificação automatizada: o texto do estado vazio do gasto mensal, a distinção visual de compra cancelada na lista, a exibição condicional do aviso "valor parcial" quando há itens sem preço, e a navegação por toque numa contagem de estado levando à despensa filtrada.

## Como reproduzir

```
find app -iname "*resumo*test*" -o -path "*compra/historico*test*"
```
Nenhum arquivo retornado.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-03-resumo-valores-e-historico/specs/resumo-de-valores/spec.md`, cenário "Acesso a partir da contagem"; `gasto-mensal/spec.md`, cenário "Nenhuma compra ainda"; `historico-de-compras/spec.md`, cenário "Compras canceladas distinguíveis".

## Observado (saída real, caminho:linha)

`app/(tabs)/resumo.tsx:109` (`router.push`), `:137-141` (estado vazio), `:75-81,89-95` (aviso de valor parcial); `app/compra/historico.tsx:27,43-51` (distinção de cancelada) — todos sem teste de composição na tela.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-telas-resumo-historico-compras`: RTL cobrindo as 3 telas com hooks mockados, focando nos comportamentos só existentes na composição visual.
