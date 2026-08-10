---
id: ACHADO-046
pr: 11
change: 2026-08-03-resumo-valores-e-historico
capability: gasto-mensal
severidade: baixa
fase: F3
estado: virou-change
change-correcao: cobertura-lista-e-compra
---
## O que quebra

O cenário "compra finalizada com total zero" (deve contar na quantidade de compras do mês e contribuir com zero ao total) não tem teste dedicado na agregação mensal. O comportamento correto decorre da forma do SQL (`COUNT(*)` independente de `valor_total_pago`, `COALESCE(SUM(...),0)`), mas nenhum teste finaliza de fato uma compra com `totalPago=0` e verifica o resultado agregado.

## Como reproduzir

```
grep -n "totalPago.*0\|total.*zero" src/infrastructure/repositories/sqlite-compra.repository.test.ts src/application/resumo/use-gasto-mensal.test.ts
```
Não há teste que combine "compra finalizada" + "total zero" no contexto de `gastoPorMes`/`useGastoMensal`.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-03-resumo-valores-e-historico/specs/gasto-mensal/spec.md`, cenário "Compra finalizada com total zero": "ela conta na quantidade de compras do mês e contribui com zero ao total."

## Observado (saída real, caminho:linha)

`src/infrastructure/repositories/sqlite-compra.repository.ts:348-358` (`gastoPorMes`) sem teste que exercite esse caso específico.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-gasto-mensal-total-zero`: teste finalizando uma compra sem itens marcados (total zero) e confirmando que `qtdCompras` inclui essa compra enquanto `totalPago` do mês não é afetado.
