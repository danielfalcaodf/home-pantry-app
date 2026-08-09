---
id: ACHADO-010
pr: 2
change: fundacao-dominio
capability: unidades-e-valores
severidade: baixa
fase: F3
estado: aberto
---
## O que quebra

O requisito "Classificação de unidade divisível e indivisível" exige, no cenário "Conjunto fechado de unidades", que o compilador de tipos rejeite qualquer valor fora das sete unidades suportadas. Isso é verdade hoje porque `Unidade` em `src/domain/shared/unidade.ts` é um tipo literal derivado de `UNIDADES as const`, mas não existe nenhum teste de tipo (`@ts-expect-error`, `tsd`, `expectType`) que prove essa rejeição — a garantia depende só de ninguém trocar `Unidade` por `string` no futuro sem perceber a regressão. Mesma classe de lacuna do ACHADO-009 (PR-01, `Result<T,E>`).

## Como reproduzir

```
grep -rn "expectType\|tsd\|@ts-expect-error" src/domain/shared/unidade.test.ts
```
Não retorna nada. O teste existente (`unidade.test.ts:4`) só confirma o array `UNIDADES` em runtime; a função `ehUnidade()` testada em `:33` é um type guard em runtime, não uma prova de rejeição em tempo de compilação de um literal inválido atribuído a `Unidade`.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-fundacao-dominio/specs/unidades-e-valores/spec.md`, cenário "Conjunto fechado de unidades": "WHEN um valor fora das sete unidades suportadas é usado THEN o compilador de tipos rejeita o valor" — requisito sobre comportamento do compilador, não de runtime.

## Observado (saída real, caminho:linha)

`src/domain/shared/unidade.ts:1-3` define `UNIDADES` e `Unidade` como tipo fechado; `src/domain/shared/unidade.test.ts` não contém nenhuma asserção de tipo.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-tipo-unidade-fechada`: adicionar um teste com `@ts-expect-error` atribuindo uma string arbitrária (ex. `'tonelada'`) a uma variável tipada `Unidade`, validado via `tsc --noEmit` no CI — mesma change sugerida em ACHADO-009 pode cobrir os dois casos juntos.
