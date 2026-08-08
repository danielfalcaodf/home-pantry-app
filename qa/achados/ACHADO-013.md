---
id: ACHADO-013
pr: 3
change: persistencia-sqlite
capability: banco-local
severidade: media
fase: F3
estado: aberto
---
## O que quebra

O cenário "Aplicação a partir de versão intermediária" (migrations aplicadas sobre um banco em qualquer versão anterior publicada concluem sem erro e produzem o mesmo schema final) não tem teste. Quando a PR-03 foi originalmente testada (F2), isso era N/A porque só existia a migration `0000_init`. Hoje o repositório tem 4 migrations (`0000_init`, `0001_configuracao`, `0002_compra_item_exclusao`, `0003_compra_item_atualizar_preco`), então o cenário é testável e continua sem cobertura — é uma lacuna real, ainda que não seja uma regressão introduzida por nenhuma PR específica (só ficou testável com o acúmulo de migrations).

## Como reproduzir

```
ls src/infrastructure/db/migrations/*.sql
grep -n "intermedi\|versão anterior" src/infrastructure/db/migrations.test.ts
```
4 arquivos `.sql` existem; a busca no teste não retorna nada.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-persistencia-sqlite/specs/banco-local/spec.md`, cenário "Aplicação a partir de versão intermediária" — e a regra do `CLAUDE.md`: "testar aplicando desde o schema vazio e desde cada versão anterior".

## Observado (saída real, caminho:linha)

`src/infrastructure/db/migrations.test.ts:23-63` só testa aplicação sobre banco vazio (`describe('migrations aplicadas em sequência sobre banco vazio')`). Não há `describe` equivalente para aplicar um subconjunto de migrations e depois o restante.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-migration-versao-intermediaria`: para cada migration N ≥ 1, um teste que aplica migrations `0000..N-1`, insere dados representativos, aplica o restante, e compara o schema final com o schema aplicado desde vazio.
