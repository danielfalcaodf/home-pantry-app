---
id: ACHADO-029
pr: 7
change: lista-de-compras
capability: itens-avulsos
severidade: media
fase: F3
estado: virou-change
change-correcao: cobertura-lista-e-compra
---
## O que quebra

`SheetAvulso` (`src/presentation/components/sheet-avulso.tsx`) é o único ponto de entrada de UI para criar e editar um item avulso, e é onde vive a validação de nome obrigatório (`nomeLimpo === '' → setErroNome('Dê um nome ao item')`) exigida pelo requisito "Adicionar item avulso sem cadastrar no estoque". Não existe nenhum arquivo de teste para esse componente — os cenários "Avulso criado", "Preço opcional no avulso" e, principalmente, "Nome obrigatório no avulso" (rejeição com erro em texto) não têm nenhuma verificação automatizada. A lógica dos hooks (`useAdicionarAvulso`, `useEditarAvulso`) é testada com dados já válidos, então a validação de nome nunca é exercitada por nenhum teste do projeto.

## Como reproduzir

```
find src -iname "*sheet-avulso*test*"
```
Não retorna nenhum arquivo.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-lista-de-compras/specs/itens-avulsos/spec.md`, requisito "Adicionar item avulso sem cadastrar no estoque", cenários "Avulso criado", "Preço opcional no avulso" e "Nome obrigatório no avulso".

## Observado (saída real, caminho:linha)

`src/presentation/components/sheet-avulso.tsx:39-44`:
```ts
function salvar() {
  const nomeLimpo = nome.trim();
  if (nomeLimpo === '') {
    setErroNome('Dê um nome ao item');
    return;
  }
  ...
```
Nenhum teste em `src/presentation/components` cobre `SheetAvulso`.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-validacao-sheet-avulso`: RTL renderizando `SheetAvulso`, cobrindo salvar com nome preenchido (chama `onSalvar` com os dados corretos), salvar com nome vazio (exibe erro e não chama `onSalvar`), preço em branco (entra como `null`) e modo de edição (`inicial` preenchido).
