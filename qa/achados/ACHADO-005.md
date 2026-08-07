---
id: ACHADO-005
pr: 3
change: persistencia-sqlite
capability: persistencia-sqlite
severidade: baixa
fase: F2
estado: aberto
---
## O que quebra

`expo lint` reporta 1 warning (não erro) em `src/infrastructure/repositories/sqlite-produto.repository.ts:7:10`: `'Milesimos' is defined but never used`. Não falha `npm run verificar` (warnings não quebram o comando), mas é código morto no import.

## Como reproduzir

```bash
npm run lint
# ✖ 1 problem (0 errors, 1 warning) — src/infrastructure/repositories/sqlite-produto.repository.ts:7:10
```

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`CLAUDE.md`, "Princípios de código": "Não adicionar abstração, flag ou tratamento de erro para cenário que não pode acontecer" e clean code em geral — um import não usado é ruído que uma regra de lint já sinaliza; não deveria persistir sem uso real.

## Observado (saída real, caminho:linha)

`src/infrastructure/repositories/sqlite-produto.repository.ts:7:10` — `import { Milesimos } from ...` (ou equivalente) nunca referenciado no arquivo.

## Change sugerida (slug proposto, escopo de uma frase)

`limpar-import-nao-usado-sqlite-produto` — remover o import não utilizado de `Milesimos` em `sqlite-produto.repository.ts:7`; correção trivial de uma linha, sem risco.
