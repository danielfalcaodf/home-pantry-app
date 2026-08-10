---
id: ACHADO-023
pr: 5
change: despensa-e-cadastro-produto
capability: tela-despensa
severidade: baixa
fase: F3
estado: virou-change
change-correcao: cobertura-componentes-apresentacao
---
## O que quebra

`src/presentation/format/normalizar-busca.ts` (`normalizarParaBusca`, `casaComBusca`) implementa a normalização de acento e caixa usada na busca da despensa (`app/(tabs)/index.tsx:95`), documentada no próprio arquivo como necessária porque "o `COLLATE NOCASE` do SQLite é ASCII-only e não resolve acento". É lógica pura, fácil de testar, mas não tem teste próprio — o cenário "Busca ignora acento e caixa" do spec fica sem prova direta.

## Como reproduzir

```
find . -iname "normalizar-busca.test.ts" -not -path "*/node_modules/*"
```
Retorna vazio.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-despensa-e-cadastro-produto/specs/tela-despensa/spec.md`, requisito "Busca por nome", cenário "Busca ignora acento e caixa": 'WHEN o usuário busca por "acucar" THEN um item chamado "Açúcar" é encontrado'.

## Observado (saída real, caminho:linha)

`src/presentation/format/normalizar-busca.ts:5-16` implementa `normalizarParaBusca` (NFD + remoção de diacríticos + lowercase) e `casaComBusca`; nenhum teste exercita essas funções.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-normalizar-busca`: teste unitário direto com o caso do próprio spec (`casaComBusca('Açúcar', 'acucar')` deve ser `true`) e casos de borda (termo vazio casa com tudo, texto já normalizado).
