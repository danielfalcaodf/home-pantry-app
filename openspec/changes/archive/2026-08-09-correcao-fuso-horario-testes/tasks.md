## 1. Correção (fixar TZ no ambiente de teste)

- [x] 1.1 Fixar `process.env.TZ = 'America/Sao_Paulo'` na configuração do Jest, valendo para os dois projetos (`domain` e `app`), garantindo que roda antes de qualquer uso de `Date`.
- [x] 1.2 Ajustar a fixture de `src/presentation/format/historico-de-compras.test.ts` para expressar 03/08/2026 no fuso fixado (mantendo a expectativa `03/08/2026`).
- [x] 1.3 Ajustar as fixtures de `src/application/resumo/use-gasto-mensal.test.ts` para que a compra finalizada caia em agosto/2026 no fuso fixado (mantendo o bucket `2026-08`).

## 2. Prova do cenário do bug

- [x] 2.1 Rodar `TZ=America/Sao_Paulo npx jest src/presentation/format/historico-de-compras.test.ts` e confirmar verde (cenário exato do ACHADO-001).
- [x] 2.2 Rodar `TZ=America/Sao_Paulo npx jest src/application/resumo/use-gasto-mensal.test.ts` e confirmar verde (cenário exato do ACHADO-002).

## 3. Casos de borda do mesmo contexto

- [x] 3.1 Adicionar teste de borda de virada de dia: timestamp 23h59 local de 31/07 e 00h01 local de 01/08 formatam/agrupam nos dias e meses locais corretos.
- [x] 3.2 Adicionar teste que documenta a imunidade ao fuso: rodar a formatação com um instante UTC "enganoso" (meia-noite UTC) e asserir o dia local esperado, com comentário do porquê.
- [x] 3.3 Confirmar que a suíte inteira passa também com `TZ=UTC` forçado por fora **não** é esperado (o TZ da config vence) — verificar que a config sobrescreve o ambiente externo ou documentar a precedência no comentário da config.

## 4. Gate de qualidade

- [x] 4.1 Rodar `npm test` completo e `npm run verificar` — tudo verde, sem regressões. Verificado: 65 suites / 614 testes verdes (incl. rodada com `TZ=UTC` externo provando que `jest.tz.js` vence); `verificar` (fronteiras + lint + typecheck) limpo.
