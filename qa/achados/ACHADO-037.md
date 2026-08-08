---
id: ACHADO-037
pr: 8
change: 2026-08-03-modo-compra-e-fechamento
capability: modo-compra
severidade: baixa
fase: F3
estado: aberto
---
## O que quebra

A mudança de aparência do item marcado (cor secundária, risco horizontal, perda de preenchimento) e a geometria do controle de marcação (quadrado, alvo ≥48×48) são exigidas pelo spec de design, mas os testes de `item-compra.tsx` verificam apenas o comportamento de callback (`onMarcar`/`onDesmarcar`), não os estilos aplicados.

## Como reproduzir

```
grep -n "textDecorationLine\|borderRadius\|ALVO_TOQUE" src/presentation/components/item-compra.test.tsx
```
Não retorna nenhuma asserção de estilo — o teste em `item-compra.test.tsx:52-74` só verifica chamadas de função ao toque.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-03-modo-compra-e-fechamento/specs/modo-compra/spec.md`, cenários "Item marcado muda de aparência", "Alvo de toque adequado" e "Controle quadrado, não circular".

## Observado (saída real, caminho:linha)

Implementação presente em `src/presentation/components/item-compra.tsx:76-98` (estilos condicionais por `comprado`) e uso de `ALVO_TOQUE_MINIMO=48` em `item-compra.tsx:59-88`, mas sem asserção de estilo correspondente em `item-compra.test.tsx`.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-estilo-item-compra`: adicionar asserções de `style`/`textDecorationLine`/dimensões mínimas no teste de renderização de `ItemCompra` para os estados marcado/desmarcado.
