---
id: ACHADO-041
pr: 10
change: 2026-08-03-ajuste-e-conferencia-estoque
capability: cadastro-de-produto
severidade: media
fase: F3
estado: aberto
---
## O que quebra

`app/produto/[id].tsx` (a tela de detalhe do produto) não tem nenhum teste. Isso deixa sem verificação automatizada: o toque na quantidade atual abrindo o caminho de ajuste (não um campo de texto solto), a prop `quantidadeAtualEditavel={false}` de fato bloqueando edição direta, a quantidade em destaque no papel tipográfico de display, e o acesso ao histórico completo a partir do resumo.

## Como reproduzir

```
find app -iname "*produto*test*"
```
Não retorna nenhum arquivo para `app/produto/[id].tsx`.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-03-ajuste-e-conferencia-estoque/specs/cadastro-de-produto/spec.md`, cenários "Quantidade em destaque", "Correção da quantidade atual pelo ajuste" e "Quantidade atual não é campo de texto solto".

## Observado (saída real, caminho:linha)

Implementação presente em `app/produto/[id].tsx:180-194` (papel display + toque abre ajuste) e `formulario-produto.tsx:45,59,146-151` (`quantidadeAtualEditavel`), mas sem asserção de teste que confirme o comportamento composto na tela.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-tela-detalhe-produto`: RTL renderizando `app/produto/[id].tsx` com hooks mockados, confirmando que tocar a quantidade abre o sheet de ajuste e que o campo de quantidade não aceita edição direta.
