---
id: ACHADO-044
pr: 10
change: 2026-08-03-ajuste-e-conferencia-estoque
capability: diagnostico-de-integridade
severidade: baixa
fase: F3
estado: aberto
---
## O que quebra

O cenário "verificação não altera dados" (rodar o diagnóstico de integridade não deve escrever nada no banco) não tem teste explícito. `reconciliar` é implementada só com `SELECT`, o que satisfaz o requisito por construção, mas nenhum teste captura isso ativamente (ex.: contando linhas de `movimento_estoque`/`produto` antes e depois da chamada).

## Como reproduzir

```
grep -n "reconciliar" src/infrastructure/repositories/sqlite-movimento.repository.test.ts
```
Os testes existentes verificam o resultado da reconciliação (divergências encontradas), não a ausência de escrita.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-03-ajuste-e-conferencia-estoque/specs/diagnostico-de-integridade/spec.md`, cenário "Verificação não altera dados": "nenhuma escrita ocorre no banco."

## Observado (saída real, caminho:linha)

`src/infrastructure/repositories/sqlite-movimento.repository.ts:136` (`reconciliar`, somente leitura) sem teste que compare contagem de registros antes/depois da chamada.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-reconciliar-sem-escrita`: teste que registra a contagem de `movimento_estoque` e `produto` antes de chamar `reconciliar` e confirma que permanece idêntica depois.
