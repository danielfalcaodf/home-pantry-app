---
id: ACHADO-006
pr: 5
change: despensa-e-cadastro-produto
capability: despensa-e-cadastro-produto
severidade: critica
fase: F2
estado: aberto
---
## O que quebra

`npm run verificar` **falha com exit code 1** nesta PR isolada — 2 erros de lint `react-hooks/set-state-in-effect` (não warnings): `setState` chamado sincronamente dentro de um `useEffect`, o que o próprio ESLint classifica como podendo disparar cascading renders. Isso significa que, se a PR 5 fosse mesclada e testada isoladamente (ou se a cadeia parasse aqui), o gate de CI/pre-merge (`npm run verificar`, exigido pelo `CLAUDE.md` "rodar antes de qualquer merge") bloquearia o merge.

## Como reproduzir

```bash
git worktree add ../qa-pr05 change/despensa-e-cadastro-produto
cd ../qa-pr05 && npm ci && npm run verificar; echo $?
# EXIT CODE: 1
```

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`CLAUDE.md`, tabela de Comandos: "`npm run verificar` | Agregado: fronteiras + lint + typecheck (rodar antes de qualquer merge)". Uma PR que faz parte da cadeia empilhada e é candidata a merge individual deveria passar nesse gate isoladamente.

## Observado (saída real, caminho:linha)

```
/home/devdaniel/repos/qa-pr05/src/application/estoque/use-categorias.ts:28:10
  error  Calling setState synchronously within an effect can trigger cascading renders — react-hooks/set-state-in-effect

/home/devdaniel/repos/qa-pr05/src/application/estoque/use-produtos.ts:69:10
  error  Calling setState synchronously within an effect can trigger cascading renders — react-hooks/set-state-in-effect

✖ 3 problems (2 errors, 1 warning)
```

**Nota importante**: o baseline da F1 (topo da cadeia, PR 13, `feat/ajuste-visual-telas-design-system`) está **verde** em `npm run verificar` (`qa/fases/F1-baseline-topo.md`). Isso significa que esses 2 erros foram corrigidos em alguma PR posterior à 5 — a rastrear durante a continuação da F2 e anotar aqui em qual PR o erro deixa de aparecer, para eventualmente decidir se a correção precisa também ser "trazida para trás" (rebase/cherry-pick) antes do merge da PR 5, ou se o problema é apenas de sequenciamento de merge.

## Change sugerida (slug proposto, escopo de uma frase)

`corrigir-set-state-em-effect-uso-produtos-categorias` — mover a chamada inicial de `recarregar(estaMontado)` em `use-produtos.ts:69` e `use-categorias.ts:28` para fora do corpo síncrono do efeito (ex.: `useEffect(() => { queueMicrotask(() => recarregar(estaMontado)) ... })` ou padrão equivalente reconhecido pela regra), preservando o comportamento de assinatura ao observador.
