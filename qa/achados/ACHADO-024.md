---
id: ACHADO-024
pr: 5
change: despensa-e-cadastro-produto
capability: cadastro-de-produto
severidade: baixa
fase: F3
estado: aberto
---
## O que quebra

O requisito "Nome duplicado é impedido com caminho de saída" exige que, ao detectar duplicidade, o app ofereça "ver o item existente" além de orientar a diferenciar o nome. A mensagem de erro em si está testada (`hooks.test.ts:90`), mas a ação de navegação para o item existente — implementada em `app/produto/novo.tsx:34-38` via o estado `duplicado` — não tem nenhum teste que confirme que tocar essa ação leva ao produto certo.

## Como reproduzir

```
grep -n "duplicado" app/produto/novo.tsx
find app -name "*.test.*"
```
A tela usa `duplicado` para guardar `{ id, nome }` do item existente; `find app -name "*.test.*"` não retorna nada (nenhuma tela tem teste).

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-despensa-e-cadastro-produto/specs/cadastro-de-produto/spec.md`, requisito "Nome duplicado é impedido com caminho de saída", cenário "Duplicidade detectada antes de salvar": "...com a ação de ver o item existente".

## Observado (saída real, caminho:linha)

`app/produto/novo.tsx:34-38` seta `duplicado` com `{ id: existente.produto.id, nome: existente.produto.nome }`, mas nenhum teste RTL confirma que a UI oferece e executa a navegação para esse id.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-navegacao-duplicidade`: teste RTL de `app/produto/novo.tsx` que preenche um nome duplicado, confirma que a ação "ver item existente" aparece, e que tocá-la navega para `/produto/[id]` com o id correto.
