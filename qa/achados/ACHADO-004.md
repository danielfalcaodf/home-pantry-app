---
id: ACHADO-004
pr: 3
change: persistencia-sqlite
capability: backup-automatico-pre-migration
severidade: media
fase: F2
estado: virou-change
change-correcao: cobertura-banco-e-migrations
---
## O que quebra

`src/infrastructure/db/backup-pre-migration.ts` — o mecanismo que faz cópia binária do `.db` antes de aplicar uma migration pendente (2 cópias mais recentes, conforme `CLAUDE.md` DATABASE §9.4) — **não tem nenhum arquivo de teste** (`backup-pre-migration.test.ts` não existe). Confirmado por busca literal no worktree da PR 3, onde o arquivo é introduzido junto com o resto de `infrastructure/db/`.

## Como reproduzir

```bash
find . -iname "*backup-pre-migration*" ! -path "*/node_modules/*"
# retorna só src/infrastructure/db/backup-pre-migration.ts, nenhum .test.ts
```

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`CLAUDE.md`, seção "Comandos"/"Regras de domínio": "`O .db` recebe cópia de segurança automática antes de aplicar migration pendente (`src/infrastructure/db/backup-pre-migration.ts`, duas cópias mais recentes)". A seção de Testes do `CLAUDE.md` exige que `infrastructure/` seja coberta por "Jest + SQLite em memória, cobrindo repositórios/transações/**migrations**" — o backup pré-migration é parte direta desse fluxo crítico (é o único mecanismo que existe entre uma migration malsucedida e perda de dados no aparelho) e fica de fora dessa cobertura.

## Observado (saída real, caminho:linha)

`src/infrastructure/db/backup-pre-migration.ts` — nenhuma referência em `*.test.ts` em todo o repositório (confirmado também no topo da cadeia, PR 13, não é uma lacuna temporária que uma PR posterior fecha).

## Change sugerida (slug proposto, escopo de uma frase)

`testar-backup-pre-migration` — cobrir o mecanismo de backup automático pré-migration com Jest + SQLite em memória: gera cópia antes de migration pendente, mantém só as 2 mais recentes, e não quebra quando não há migration pendente.
