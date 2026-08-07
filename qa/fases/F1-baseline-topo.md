---
fase: F1
titulo: Baseline no topo da cadeia
branch: feat/ajuste-visual-telas-design-system (topo da cadeia, contém as 13 changes)
commit: f6cb2fb
estado: concluida
---

## Objetivo

Congelar os números de referência no topo da cadeia (`feat/ajuste-visual-telas-design-system`), antes de percorrer as 13 PRs individualmente na F2.

## `npm run verificar`

```
Fronteiras OK: src/domain/ é TypeScript puro.
> expo lint  → sem saída (limpo)
> tsc --noEmit → sem saída (limpo)
```

**Resultado: verde**, sem achados.

## `npm test`

```
Test Suites: 2 failed, 63 passed, 65 total
Tests:       2 failed, 609 passed, 611 total
Time:        1.934 s
```

Duas suítes falham, ambas por dependência de fuso horário (máquina em `America/Sao_Paulo`, UTC-3; Jest não fixa `TZ`):

| Teste | Achado | Causa raiz |
|---|---|---|
| `src/presentation/format/historico-de-compras.test.ts:5` | [[ACHADO-001]] | `toLocaleDateString('pt-BR')` usa hora local; fixture em `Date.UTC` recua um dia |
| `src/application/resumo/use-gasto-mensal.test.ts:72` | [[ACHADO-002]] | Agrupamento mensal usa hora local; compra finalizada em `Date.UTC(2026,7,1)` cai no bucket `'2026-07'` em vez de `'2026-08'` |

Ambos localizados na change **11 — `resumo-valores-e-historico`** (arquivos vivem em `presentation/format/` e `application/resumo/`, ambos introduzidos por essa change conforme a tabela da F2). Mesma correção candidata (fixar `TZ` no ambiente Jest) → **uma única change**, `fixar-timezone-nos-testes`.

## `npm run test:cov`

```
All files            |   99.04 |    94.92 |     100 |   99.01
Test Suites: 13 passed, 13 total
Tests:       156 passed, 156 total
Time:        0.726 s
```

Piso de 90% do domínio **confirmado e superado**: 99,04% statements / 94,92% branch / 100% functions / 99,01% lines. Nenhum arquivo do domínio abaixo do piso; os módulos com `0%` (`compra.ts`, `lista.ts`, `movimento.ts`, `produto.ts`) são barrels de re-export sem lógica própria, não uma lacuna real — a confirmar em F3.

## Achados registrados nesta fase

- [[ACHADO-001]] — fuso horário em `formatarDataDaCompra` (severidade média).
- [[ACHADO-002]] — fuso horário em `useGastoMensal` (severidade média, mesma raiz do ACHADO-001).
- [[ACHADO-003]] — inconsistência de gerenciador de pacotes (`npm` vs `pnpm`), registrado em F0 mas documentado aqui também por afetar reprodutibilidade do baseline.

## Critério de saída

- [x] `npm run verificar` rodado e resultado registrado (verde).
- [x] `npm test` rodado e resultado registrado (609/611, 2 falhas explicadas e ancoradas em achados).
- [x] `npm run test:cov` rodado e piso de 90% confirmado (99,04% stmts / 94,92% branch).
- [x] ACHADO-001 e ACHADO-002 escritos.

**F1 concluída.**
