---
id: ACHADO-001
pr: 11
change: resumo-valores-e-historico
capability: historico-de-compras
severidade: media
fase: F1
estado: aberto
---
## O que quebra

`formatarDataDaCompra` usa `Date#toLocaleDateString('pt-BR')`, que formata na **hora local** da máquina em execução. A fixture do teste usa `Date.UTC(2026, 7, 3)` (2026-08-03 00:00 UTC), que em fuso UTC-3 corresponde a 2026-08-02 21:00 local — um dia civil antes do esperado.

## Como reproduzir

```bash
TZ=America/Sao_Paulo npx jest src/presentation/format/historico-de-compras.test.ts
```

Falha com `Expected: "03/08/2026" / Received: "02/08/2026"`. Rodando com `TZ=UTC` o teste passa, o que confirma que a raiz é fuso, não lógica de formatação.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`src/presentation/format/historico-de-compras.test.ts:5` documenta a expectativa: `Date.UTC(2026, 7, 3)` deve formatar como `03/08/2026`. Nenhum spec do `openspec/specs/` define explicitamente qual fuso rege a exibição de datas, mas o comportamento correto de produto é a data exibida bater com o dia em que o evento ocorreu na hora local do usuário — que é justamente o que a fixture tenta expressar ao fixar `Date.UTC(2026,7,3)` esperando `03/08`.

## Observado (saída real, caminho:linha)

`src/presentation/format/historico-de-compras.test.ts:5` — `expect(formatarDataDaCompra(Date.UTC(2026, 7, 3))).toBe('03/08/2026')` recebe `'02/08/2026'` quando o Jest roda na máquina em `America/Sao_Paulo` (UTC-3) sem `TZ` fixado no ambiente de teste.

## Change sugerida (slug proposto, escopo de uma frase)

`fixar-timezone-nos-testes` — fixar `TZ=UTC` (ou `America/Sao_Paulo`, a decidir) no `jest.config`/setup do projeto, cobrindo também [[ACHADO-002]] (mesma raiz, um nível acima em `use-gasto-mensal`).
