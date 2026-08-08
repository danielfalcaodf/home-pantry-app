---
id: ACHADO-015
pr: 4
change: design-system-tema
capability: componentes-base
severidade: baixa
fase: F3
estado: aberto
---
## O que quebra

Dois cenários exigem que o compilador de tipos rejeite valores inválidos: "Papel inválido é rejeitado" (`componentes-base`, componente `Texto`) e "Tema tipado" (`tema-e-tokens`, acesso a token inexistente). Nenhum dos dois tem teste de tipo (`@ts-expect-error`/`tsd`) — mesma classe de lacuna do ACHADO-009 (PR-01, `Result<T,E>`) e ACHADO-010 (PR-02, `Unidade`).

## Como reproduzir

```
grep -rn "ts-expect-error\|expectType" src/presentation/
```
Não retorna nada.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-design-system-tema/specs/componentes-base/spec.md`, cenário "Papel inválido é rejeitado"; `specs/tema-e-tokens/spec.md`, cenário "Tema tipado".

## Observado (saída real, caminho:linha)

`src/presentation/components/texto.tsx` e `src/presentation/theme/tokens.ts` definem os tipos fechados (papel tipográfico, chaves de tema), mas nenhum teste em `src/presentation/**/*.test.*` prova a rejeição em tempo de compilação.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-tipo-design-system`: estender a change já sugerida em ACHADO-009/010 para cobrir também `Texto` (papel inválido) e `Theme` (token inexistente) — um único arquivo de testes de tipo para o projeto inteiro, validado via `tsc --noEmit`.
