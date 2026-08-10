**Type:** Bug Fix

## Why

Dois testes da suíte (`historico-de-compras.test.ts` e `use-gasto-mensal.test.ts`) falham em qualquer máquina com fuso diferente de UTC (ex.: `TZ=America/Sao_Paulo`), porque as fixtures usam `Date.UTC(...)` enquanto o código de produção formata e agrupa datas — intencionalmente — em hora local (ACHADO-001 e ACHADO-002 da campanha de QA, mesma raiz). O código de produção está correto e consistente entre a implementação SQLite (`strftime(..., 'localtime')`) e o repositório falso; o único elemento fora de sincronia é o ambiente de teste, que não fixa `TZ`. Enquanto isso não for corrigido, `npm test` não fica verde de forma determinística — e o gate de testes de `/opsx:test` bloqueia todas as demais changes da fila.

## What Changes

- Fixar o fuso horário do ambiente Jest (`TZ`) na configuração/setup dos projetos de teste, tornando `npm test` determinístico independentemente da máquina.
- Decidir e registrar o fuso fixado: `America/Sao_Paulo` (fuso do usuário-alvo, que exercita o desalinhamento UTC×local nas fixtures) — as fixtures dos dois testes afetados são ajustadas para expressar instantes no fuso fixado, mantendo a intenção original de cada cenário.
- Nenhuma mudança em `src/` de produção: `formatarDataDaCompra` e o agrupamento mensal por hora local permanecem como estão (comportamento correto de produto, já coberto pelo requisito "Agrupamento por fuso horário local" de `gasto-mensal`).

## Capabilities

### New Capabilities
(nenhuma)

### Modified Capabilities
- `projeto-base`: novo requisito de determinismo do ambiente de teste — a suíte roda com fuso horário fixado, e fixtures de data expressam instantes nesse fuso.

## Impact

- `jest.config.js` (ou setup equivalente dos projetos `domain` e `app`) — fixar `process.env.TZ`.
- `src/presentation/format/historico-de-compras.test.ts` — fixture alinhada ao fuso fixado.
- `src/application/resumo/use-gasto-mensal.test.ts` — fixture alinhada ao fuso fixado.
- Nenhum impacto em `src/` de produção, banco ou schema.

### Dependencies between changes

Sem dependência de outra change ativa — é a primeira da fila (`ORDER.md` 01) justamente porque desbloqueia o gate `npm test` de todas as outras.
