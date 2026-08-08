---
id: ACHADO-009
pr: 1
change: bootstrap-projeto-expo
capability: primitivos-compartilhados
severidade: baixa
fase: F3
estado: aberto
---
## O que quebra

O requisito "Result para falhas esperadas" exige que o compilador rejeite o acesso a `.valor`/`.erro` de um `Result<T,E>` sem antes discriminar por `.ok`. Isso é verdade hoje pela forma da union type em `src/shared/result.ts`, mas não existe nenhum teste de tipo (`@ts-expect-error`, `tsd`, `expectType`) que prove isso — a garantia depende só de ninguém alterar a definição do tipo no futuro sem perceber a regressão.

## Como reproduzir

```
grep -rn "expectType\|tsd\|@ts-expect-error" src/shared/
```
Não retorna nada.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-bootstrap-projeto-expo/specs/primitivos-compartilhados/spec.md`, cenário "Discriminação obriga tratamento": "WHEN o consumidor acessa o valor de um Result sem antes discriminar sucesso de falha THEN o compilador de tipos rejeita o acesso" — um requisito sobre comportamento do compilador precisa de um teste de tipo para não regressar silenciosamente.

## Observado (saída real, caminho:linha)

`src/shared/result.test.ts` só testa comportamento em runtime (valor/erro após narrowing manual com `if`), nunca a rejeição em tempo de compilação do acesso sem narrowing.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-tipo-result-discriminacao`: adicionar um teste com `@ts-expect-error` sobre `resultado.valor` fora do bloco `if (resultado.ok)`, validado via `tsc --noEmit` no CI.
