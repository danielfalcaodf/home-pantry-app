---
id: ACHADO-031
pr: 7
change: lista-de-compras
capability: lista-derivada
severidade: baixa
fase: F3
estado: virou-change
change-correcao: cobertura-lista-e-compra
---
## O que quebra

O requisito "Ordenação e agrupamento por categoria" exige que a preferência de agrupamento persista entre aberturas da tela (cenário "Preferência de agrupamento mantida"). Essa persistência é implementada em `usePreferenciaDeAgrupamento` (`src/application/lista/use-preferencia-agrupamento.ts`), que lê e grava a preferência via `ConfiguracaoRepository`. Não existe nenhum arquivo de teste para esse hook — não há verificação de que `alternar()` grava o valor invertido no repositório, nem de que o valor lido na montagem é aplicado ao estado exibido.

## Como reproduzir

```
find src -iname "*preferencia-agrupamento*test*"
```
Não retorna nenhum arquivo.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-lista-de-compras/specs/lista-derivada/spec.md`, requisito "Ordenação e agrupamento por categoria", cenário "Preferência de agrupamento mantida".

## Observado (saída real, caminho:linha)

`src/application/lista/use-preferencia-agrupamento.ts:19-43` implementa leitura e escrita da preferência sem nenhum teste correspondente (`use-preferencia-agrupamento.test.ts` não existe).

## Change sugerida (slug proposto, escopo de uma frase)

`teste-preferencia-agrupamento`: teste com repositório fake confirmando leitura inicial (`agrupado` reflete valor salvo) e que `alternar()` inverte o valor e persiste via `gravar`.
