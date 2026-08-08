---
id: ACHADO-011
pr: 3
change: persistencia-sqlite
capability: banco-local
severidade: baixa
fase: F3
estado: aberto
---
## O que quebra

Três garantias de conexão exigidas pelo requisito "Conexão única com PRAGMAs obrigatórios" não têm teste automatizado: modo WAL ativo, conexão singleton e escuta de mudanças habilitada. O código as implementa (`src/infrastructure/db/client.ts`), mas nenhum teste consulta o PRAGMA de volta, compara identidade de instância entre dois imports, ou exercita `observador.ts`.

## Como reproduzir

```
grep -n "journal_mode\|singleton\|addDatabaseChangeListener" src/infrastructure/db/client.test.ts
find src/infrastructure -iname "*observador*test*"
```
Nenhum resultado relevante.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-persistencia-sqlite/specs/banco-local/spec.md`, requisito "Conexão única com PRAGMAs obrigatórios", cenários "Modo WAL ativo", "Conexão é singleton" e "Escuta de mudanças habilitada".

## Observado (saída real, caminho:linha)

`src/infrastructure/db/client.ts:15` seta `PRAGMA journal_mode = WAL` mas o teste em `client.test.ts` só verifica `foreign_keys` (linhas 4-25). `src/infrastructure/db/observador.ts` não tem arquivo de teste correspondente.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-conexao-banco-garantias`: adicionar em `client.test.ts` uma consulta `PRAGMA journal_mode` esperando `'wal'`, um teste que importa `db` por dois caminhos de módulo e compara referência, e um `observador.test.ts` que mocka `addDatabaseChangeListener` e confirma que `assinar()` o invoca e que a função de cancelamento remove a inscrição.
