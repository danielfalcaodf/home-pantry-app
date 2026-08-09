---
id: ACHADO-043
pr: 10
change: 2026-08-03-ajuste-e-conferencia-estoque
capability: historico-do-produto
severidade: baixa
fase: F3
estado: aberto
---
## O que quebra

`src/presentation/theme/cor-do-estado.ts` (função `corDoMovimento`, que distingue visualmente consumo/reposição/ajuste no histórico) não tem arquivo de teste próprio.

## Como reproduzir

```
find src -iname "cor-do-estado*test*"
```
Não retorna nenhum arquivo.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-03-ajuste-e-conferencia-estoque/specs/historico-do-produto/spec.md`, cenário "Tipos distinguíveis": "os três são visualmente distinguíveis."

## Observado (saída real, caminho:linha)

`src/presentation/theme/cor-do-estado.ts:16-24` (`corDoMovimento`) sem teste unitário que confirme que os três tipos retornam cores distintas dos tokens de tema.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-cor-do-movimento`: teste unitário simples comparando o retorno de `corDoMovimento` para os três tipos, confirmando que não há duas cores iguais.
