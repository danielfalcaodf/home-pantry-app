---
id: ACHADO-002
pr: 11
change: resumo-valores-e-historico
capability: gasto-mensal
severidade: media
fase: F1
estado: aberto
---
## O que quebra

`useGastoMensal` agrupa compras finalizadas por mês usando o horário **local** da máquina (via `getMonth()`/`getFullYear()` ou equivalente), enquanto o teste finaliza a compra com `Date.UTC(2026, 7, 1)` (2026-08-01 00:00 UTC). Em fuso UTC-3 esse instante cai em 2026-07-31 21:00 local — a compra é contabilizada no bucket `'2026-07'`, não `'2026-08'` como o teste espera.

## Como reproduzir

```bash
TZ=America/Sao_Paulo npx jest src/application/resumo/use-gasto-mensal.test.ts -t "reage a mudanças notificadas"
```

Falha com `meses[0]` (bucket `'2026-08'`) retornando `{ totalPago: 0, qtdCompras: 0 }` em vez de `{ totalPago: 1234, qtdCompras: 1 }` — a compra "sumiu" do mês esperado porque foi contabilizada em julho.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`src/application/resumo/use-gasto-mensal.test.ts:64-75` — o teste "reage a mudanças notificadas pelo observador" espera que uma compra finalizada em `Date.UTC(2026, 7, 1)` apareça no bucket do mês corrente (`'2026-08'`, coerente com `agoraFixo = Date.UTC(2026, 7, 3)` usado em todo o describe). O agrupamento mensal precisa ser consistente com a mesma referência de "agora" usada no resto do hook.

## Observado (saída real, caminho:linha)

`src/application/resumo/use-gasto-mensal.test.ts:72` — `waitFor(() => expect(result.current.meses[0]).toEqual({ mes: '2026-08', totalPago: 1234, qtdCompras: 1 }))` recebe `{ mes: '2026-08', totalPago: 0, qtdCompras: 0 }`; a raiz é a mesma de [[ACHADO-001]], um nível acima: o bucket de mês é derivado do horário local, não UTC, e a fixture usa `Date.UTC`.

## Change sugerida (slug proposto, escopo de uma frase)

`fixar-timezone-nos-testes` — mesma change de [[ACHADO-001]]: fixar `TZ` no ambiente Jest resolve os dois, já que a causa raiz é idêntica (mistura de fixtures em UTC com formatação/agrupamento em hora local).
