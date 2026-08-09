---
id: ACHADO-047
pr: 11
change: 2026-08-03-resumo-valores-e-historico
capability: historico-de-compras
severidade: baixa
fase: F3
estado: aberto
---
## O que quebra

O cenário "itens não marcados/não comprados distinguíveis" no detalhe de uma compra finalizada não tem teste — nem no hook (`use-detalhe-compra`) nem na tela. `use-detalhe-compra.test.ts` só exercita itens comprados e avulsos, nunca um item com `comprado: false` no detalhe.

## Como reproduzir

```
grep -n "comprado.*false\|não comprado" src/application/resumo/use-detalhe-compra.test.ts
```
Sem resultado.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-03-resumo-valores-e-historico/specs/historico-de-compras/spec.md`, cenário "Itens não comprados distinguíveis": "eles aparecem identificados como não comprados."

## Observado (saída real, caminho:linha)

`app/compra/historico/[id].tsx:57,63` (`tom={item.comprado?...}`, `' · não comprado'`) sem teste que monte esse caso.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-item-nao-comprado-detalhe`: estender `use-detalhe-compra.test.ts` com um item `comprado: false` e confirmar que ele é retornado/marcado distintamente.
