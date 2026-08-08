---
id: ACHADO-036
pr: 8
change: 2026-08-03-modo-compra-e-fechamento
capability: fechamento-de-compra
severidade: baixa
fase: F3
estado: aberto
---
## O que quebra

O movimento de estoque gravado pelo fechamento de compra registra autor, data/hora, variação e quantidade resultante, mas nenhum teste verifica esses valores individualmente — só a contagem de movimentos por `compra_id`.

## Como reproduzir

```
grep -n "compra_id\|compraId" src/infrastructure/repositories/sqlite-compra.repository.test.ts
```
As asserções em torno de `sqlite-compra.repository.test.ts:254-257` contam quantos movimentos existem para a compra, sem checar `usuarioId`, `criadoEm`, `quantidadeDelta` ou `quantidadeResultante` de cada um.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-03-modo-compra-e-fechamento/specs/fechamento-de-compra/spec.md`, cenário "Movimento registra autor e resultado": "WHEN uma reposição é gravada THEN o movimento registra o usuário, a data e hora, a variação e a quantidade resultante."

## Observado (saída real, caminho:linha)

Implementação em `src/infrastructure/repositories/sqlite-compra.repository.ts:271-283` grava todos os campos corretamente, mas `sqlite-compra.repository.test.ts:254-257` só verifica a quantidade de linhas, não os valores.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-campos-movimento-fechamento`: estender o teste de fechamento para buscar um movimento específico por `produtoId` e comparar `usuarioId`, `criadoEm`, `quantidadeDelta` e `quantidadeResultante` com os valores esperados.
