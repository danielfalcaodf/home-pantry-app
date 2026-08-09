---
id: ACHADO-022
pr: 5
change: despensa-e-cadastro-produto
capability: cadastro-de-produto
severidade: media
fase: F3
estado: aberto
---
## O que quebra

`src/presentation/components/formulario-produto.tsx` não tem nenhum arquivo de teste. Ele implementa vários comportamentos exigidos pelo spec que só existem nesse componente, não na camada de hooks: campos opcionais recolhidos até expandir, filtro de sugestões de categoria a partir do que já existe (`sugestoes` calculado nas linhas 69-73), e o rótulo em vocabulário do usuário para quantidade necessária. A lógica de validação e persistência (testada em `hooks.test.ts`) é diferente do comportamento visual/interativo do formulário, que fica sem cobertura.

## Como reproduzir

```
find . -iname "formulario-produto*test*" -not -path "*/node_modules/*"
```
Retorna vazio.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-despensa-e-cadastro-produto/specs/cadastro-de-produto/spec.md`, requisitos "Cadastro com campos essenciais em primeiro plano" (cenário "Campos opcionais recolhidos") e "Autocomplete de categoria a partir do existente" (cenários "Sugestões vêm dos dados", "Escolher existente evita variante").

## Observado (saída real, caminho:linha)

`src/presentation/components/formulario-produto.tsx:69-73` implementa o filtro de sugestões; não há `formulario-produto.test.tsx`.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-formulario-produto`: teste RTL cobrindo a seção "mais opções" recolhida por padrão, a lista de sugestões de categoria filtrada pelo texto digitado, e a escolha de uma sugestão preenchendo o campo com o valor exato oferecido.
