---
id: ACHADO-012
pr: 3
change: persistencia-sqlite
capability: banco-local
severidade: media
fase: F3
estado: virou-change
change-correcao: cobertura-banco-e-migrations
---
## O que quebra

O fluxo de preparação do banco na abertura do app (`usePrepararBanco` em `src/composicao/banco.ts`, consumido por `app/_layout.tsx`) não tem nenhum teste automatizado que exercite os dois cenários exigidos pelo spec: aplicar migrations pendentes com sucesso antes de renderizar a tela normal, e mostrar `TelaErro` quando a migration falha. O código implementa os dois caminhos (`_layout.tsx:33-56`), mas isso hoje só seria validado manualmente ou por E2E (F5, ainda bloqueada) — um teste React Testing Library com `useMigrations` mockado não depende de emulador e poderia cobrir isso já.

## Como reproduzir

```
find app -name "*.test.*"
```
Vazio — não existe teste para `app/_layout.tsx` nem para `src/composicao/banco.ts`.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-persistencia-sqlite/specs/banco-local/spec.md`, requisito "Migrations forward-only aplicadas na abertura", cenários "Migration aplicada com sucesso" e "Falha de migration é visível".

## Observado (saída real, caminho:linha)

`app/_layout.tsx:33` chama `usePrepararBanco()`; linhas 47-56 renderizam `TelaErro` quando `banco.erro` está presente. Nenhum teste em `src/composicao/` ou `app/` mocka `drizzle-orm/expo-sqlite/migrator`'s `useMigrations` para simular sucesso/erro e confirmar o comportamento.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-preparacao-banco-rtl`: adicionar teste RTL de `RootLayout` (projeto Jest `app`) que mocka `useMigrations` retornando `{ success: true, error: undefined }` e depois `{ success: false, error: new Error(...) }`, confirmando renderização da rota normal vs. `TelaErro` em cada caso.
