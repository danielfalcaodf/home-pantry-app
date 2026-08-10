---
id: ACHADO-014
pr: 3
change: persistencia-sqlite
capability: repositorios
severidade: baixa
fase: F3
estado: virou-change
change-correcao: cobertura-banco-e-migrations
---
## O que quebra

O requisito "Consulta da despensa com estado e ordenação" exige, no cenário "Colunas explícitas", que a consulta "nomeie as colunas retornadas e NÃO use seleção de todas as colunas". `listarDespensa` em `src/infrastructure/repositories/sqlite-produto.repository.ts:158-160` usa `.select()` do Drizzle sem argumento (todas as colunas da tabela), enquanto a consulta irmã `listarFaltantes` na mesma classe (linhas 181-189) nomeia cada coluna explicitamente em um objeto.

**Ressalva de interpretação**: o Drizzle, mesmo com `.select()` vazio, gera SQL com os nomes de coluna explícitos (nunca `SELECT *` literal), porque conhece o schema. Então, dependendo de como o requisito do spec é lido — "não usar `SELECT *` no SQL gerado" vs. "não trazer todas as colunas da tabela para a camada de aplicação" — isso pode ser um falso positivo. Registrado para revisão humana, não corrigido aqui (achado só descreve).

## Como reproduzir

```
sed -n '158,173p' src/infrastructure/repositories/sqlite-produto.repository.ts
```
Mostra `.select()` sem argumento, ao contrário de `listarFaltantes` (linha 181) que nomeia colunas.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-persistencia-sqlite/specs/repositorios/spec.md`, requisito "Consulta da despensa com estado e ordenação", cenário "Colunas explícitas": "WHEN a consulta é inspecionada THEN ela nomeia as colunas retornadas e NÃO usa seleção de todas as colunas".

## Observado (saída real, caminho:linha)

`src/infrastructure/repositories/sqlite-produto.repository.ts:158-160`:
```ts
const linhas = this.db
  .select()
  .from(tabelaProduto)
```

## Change sugerida (slug proposto, escopo de uma frase)

`revisar-colunas-explicitas-despensa`: decisão humana primeiro (se o requisito é sobre SQL literal ou sobre a prática de código); se confirmado como divergência real, alinhar `listarDespensa` ao padrão de `listarFaltantes` nomeando as colunas explicitamente no `.select({...})`.
